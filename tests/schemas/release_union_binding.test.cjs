'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture}=require('../release/union-fixture.cjs');
const crypto=require('node:crypto');
const sri=b=>'sha512-'+crypto.createHash('sha512').update(b).digest('base64');
const union=require('../../scripts/release/union.cjs');
test('real committed source/provenance and both controlled authenticated API envelopes bind immutable bytes; no product acceptance claimed',async t=>{
 const f=fixture(t,{actual:true});for(const job of f.jobs)delete job.run_attempt;
 await union.verifyFreshUnion(f.options);
 const authenticatedIndex=JSON.parse(fs.readFileSync(path.join(f.options.directory,'index.json')));
 assert.equal(authenticatedIndex.jobsEndpoint,'/repos/konnilabs/xtend/actions/runs/'+f.run.id+'/attempts/'+f.run.run_attempt+'/jobs');
 assert.ok(authenticatedIndex.jobs.every(job=>!Object.hasOwn(job,'run_attempt')));
 const source=fs.readFileSync(path.join(f.options.directory,'source.zip'));
 const artifact={sourceSha:f.expected.coreSha,manifestIntegrity:'controlled-contract-only',manifest:{sealedAt:new Date(f.now).toISOString(),candidateBinding:{demoSha:f.expected.demoSha}}};
 fs.mkdirSync(path.join(f.directory,'union-evidence'));
 fs.cpSync(f.options.directory,path.join(f.directory,'union-evidence'),{recursive:true});
 artifact.manifest.unionEvidence={file:'union-evidence/index.json',integrity:sri(fs.readFileSync(path.join(f.directory,'union-evidence/index.json')))};
 fs.writeFileSync(path.join(f.directory,'gate-receipt.json'),JSON.stringify({repository:'konnilabs/xtend',workflow:'.github/workflows/xtend-default-gates.yml',sourceSha:f.expected.coreSha,manifestIntegrity:artifact.manifestIntegrity,runId:f.expected.context.runId,needs:f.needs}));
 union.verifyStoredUnion({directory:f.directory,artifact});
 const indexFile=path.join(f.directory,'union-evidence/index.json'),validIndex=fs.readFileSync(indexFile);
 for(const wrong of ['/repos/evil/xtend/actions/runs/'+f.run.id+'/attempts/1/jobs',
  '/repos/konnilabs/xtend/actions/runs/'+f.run.id+'/attempts/99/jobs',
  '/repos/konnilabs/xtend/actions/runs/99/attempts/1/jobs',
  '/repos/konnilabs/xtend/actions/runs/'+f.run.id+'/jobs']){
  const changed=JSON.parse(validIndex);changed.jobsEndpoint=wrong;fs.writeFileSync(indexFile,JSON.stringify(changed));
  artifact.manifest.unionEvidence.integrity=sri(fs.readFileSync(indexFile));
  assert.throws(()=>union.verifyStoredUnion({directory:f.directory,artifact}),/authentication endpoint/);
 }
 fs.writeFileSync(indexFile,validIndex);artifact.manifest.unionEvidence.integrity=sri(validIndex);
 const originalNow=Date.now;Date.now=()=>f.now+86400000;
 try{union.verifyStoredUnion({directory:f.directory,artifact});}finally{Date.now=originalNow;}
 const originalIndex=fs.readFileSync(path.join(f.directory,'union-evidence/index.json'));
 fs.appendFileSync(path.join(f.directory,'union-evidence/index.json'),' ');
 assert.throws(()=>union.verifyStoredUnion({directory:f.directory,artifact}),/manifest proof integrity/);
 fs.writeFileSync(path.join(f.directory,'union-evidence/index.json'),originalIndex);
 delete artifact.manifest.sealedAt;
 assert.throws(()=>union.verifyStoredUnion({directory:f.directory,artifact}),/original seal timestamp/);
 assert.deepEqual(fs.readFileSync(path.join(f.options.directory,'source.zip')),source);
});
for(const damage of ['red','wrong-context','wrong-node','stale','future','wrong-source-provenance'])test('real source-bound lane rejects '+damage,async t=>{
 const f=fixture(t,{actual:true}),node='24.18.0',report=f.reports.get(node),receipt=f.receipts.get(node);
 if(damage==='red'){report.ok=false;report.validation={valid:false,errors:[{code:'real-strict-red'}]};}
 if(damage==='wrong-context')receipt.context={...receipt.context,runAttempt:'99'};
 if(damage==='wrong-node')receipt.node='26.5.0';
 if(damage==='stale')report.finishedAt=new Date(f.now-3601000).toISOString();
 if(damage==='future')report.finishedAt=new Date(f.now+10000).toISOString();
 if(damage==='wrong-source-provenance')report.productiveSource.context={runId:'1',runAttempt:'99'};
 f.rebuild(node);await assert.rejects(union.verifyFreshUnion(f.options));
});
