'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const {fixture}=require('./union-fixture.cjs'),union=require('../../scripts/release/union.cjs');
const root=path.resolve(__dirname,'../..');
function changedEnv(f,values){Object.assign(f.env,values);}
const changes={
 'PR merge SHA':f=>changedEnv(f,{GITHUB_SHA:'e'.repeat(40)}),
 'PR event':f=>changedEnv(f,{GITHUB_EVENT_NAME:'pull_request'}),
 'pull_request_target':f=>changedEnv(f,{GITHUB_EVENT_NAME:'pull_request_target'}),
 'foreign repository':f=>changedEnv(f,{GITHUB_REPOSITORY:'evil/xtend'}),
 'nonmain dispatch':f=>changedEnv(f,{GITHUB_REF:'refs/heads/feature'}),
 'false publish input':f=>changedEnv(f,{XTEND_RELEASE_PUBLISH:'false'}),
 'different producer source':f=>{f.needs['union-source-artifact'].outputs['core-sha']='e'.repeat(40);},
 'different producer Demo':f=>{f.needs['union-source-artifact'].outputs['demo-sha']='e'.repeat(40);},
 'different run':f=>{f.run.id++;},
 'different attempt':f=>{f.run.run_attempt++;},
 'foreign run repository':f=>{f.run.repository.full_name='evil/xtend';},
 'foreign head repository':f=>{f.run.head_repository.full_name='evil/xtend';},
 'wrong workflow':f=>{f.workflow.path='.github/workflows/other.yml';},
 'foreign producer job run':f=>{f.jobs[0].run_id++;},
 'foreign consumer job attempt':f=>{f.jobs[1].run_attempt++;},
 'foreign consumer job source':f=>{f.jobs[2].head_sha='e'.repeat(40);},
 'wrong producer artifact run':f=>{f.producer.workflow_run.id++;},
 'wrong producer artifact source':f=>{f.producer.workflow_run.head_sha='e'.repeat(40);},
 'expired producer artifact':f=>{f.producer.expired=true;},
 'missing consumer artifact':f=>{f.metadata.pop();},
 'consumer from another run':f=>{f.metadata[1].workflow_run={id:99,head_sha:f.expected.coreSha};},
 'substituted producer ZIP':f=>{f.bytes.set(902,Buffer.from('substituted'));},
 'substituted consumer ZIP':f=>{f.bytes.set(903,Buffer.from('substituted'));}
};
for(const outcome of ['failure','cancelled','skipped',undefined])changes['producer '+outcome]=f=>{f.needs['union-source-artifact'].result=outcome;};
for(const node of ['24.18.0','26.5.0'])for(const outcome of ['failure','cancelled','skipped','missing'])changes[node+' '+outcome]=f=>{
 const i=f.jobs.findIndex(j=>j.name==='Full release gates (Node '+node+')');if(outcome==='missing')f.jobs.splice(i,1);else f.jobs[i].conclusion=outcome;
};
for(const [name,damage] of Object.entries(changes))test('Union Seal refuses '+name,async t=>{
 const f=fixture(t);damage(f);await assert.rejects(union.verifyFreshUnion(f.options));
 assert.equal(fs.existsSync(f.options.directory),false);
});
test('success job summaries and miniature unverified source never suffice for real source acceptance',async t=>{
 const f=fixture(t);await assert.rejects(union.verifyFreshUnion(f.options),/Archive digest|gzip|header|manifest/);
 assert.ok(f.calls.some(p=>p.endsWith('/904/zip')),'Both immutable consumer artifacts were actually consumed');
});
function sealWithControlledArtifact(f){
 const file=path.join(root,'scripts/release/pipeline.cjs'),real=require('./legacy-runtime.cjs').requireFrom('scripts/release/pipeline.cjs'),compiled=new Module(file,module);compiled.filename=file;
 compiled.require=name=>name==='node:child_process'?{execFileSync(){return f.expected.coreSha;},spawnSync(){throw Error('No production process allowed');}}:
  name==='./artifact.cjs'?{...real(name),verifyArtifact:async()=>({sourceSha:f.expected.coreSha,manifest:{candidateBinding:{demoSha:f.expected.demoSha}}})}:
  name==='./candidates.cjs'?{...real(name),verifyCandidateBinding:async()=>{}}:real(name);
 compiled._compile(require('./legacy-runtime.cjs').source('scripts/release/pipeline.cjs'),file);return compiled.exports;
}
for(const [name,damage] of Object.entries(changes))test('actual pipeline.seal consumes Union guard before seal mutation: '+name,async t=>{
 const f=fixture(t);damage(f);
 const saved={};for(const [k,v] of Object.entries({...f.env,XTEND_RELEASE_NEEDS:JSON.stringify(f.needs)})){saved[k]=process.env[k];process.env[k]=v;}
 t.after(()=>{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}});
 const directory=path.join(f.directory,'release');fs.mkdirSync(directory);const before=fs.readdirSync(directory);
 let directError;
 await assert.rejects(union.verifyFreshUnion(f.options),error=>{directError=error;return true;});
 await assert.rejects(sealWithControlledArtifact(f).seal({directory,manifestIntegrity:'not-a-production-artifact',lanesDirectory:'/must-not-read',unionApi:f.request,unionFetch:f.fetchBytes}),error=>{
  assert.equal(error.message,directError.message,'Pipeline must reach the same Union guard, not an unrelated front-door rejection');return true;
 });
 assert.deepEqual(fs.readdirSync(directory),before);
});
test('Core workflow uses separate source and both installed consumer lanes without Legacy gates',()=>{
 const source=fs.readFileSync(path.join(root,'.github/workflows/xtend-default-gates.yml'),'utf8');
 const job=name=>{const start=source.indexOf('  '+name+':\n');assert.ok(start>=0);const next=source.slice(start+1).search(/^  [a-z][a-z0-9-]*:\s*$/m);return next<0?source.slice(start):source.slice(start,start+1+next);};
 assert.match(job('core-source-artifact'),/permissions:\n      contents: read/);
 assert.match(job('core-source-artifact'),/scripts\/build-core-source-artifact.py --core/);
 assert.match(job('core-source-artifact'),/github.event.pull_request.head.sha \|\| github.sha/);
 assert.match(job('release-seal'),/github.event_name == 'workflow_dispatch' && inputs.publish_to_npm == true/);
 assert.match(job('core-installed-consumers'),/core-source-artifact/);
 assert.ok(!job('full-release-gates').includes('union_strict'));
 assert.ok(!job('full-release-gates').includes('union.cjs record'));assert.match(job('core-installed-consumers'),/pipeline.cjs consumers/);
 assert.match(job('core-installed-consumers'),/xtend-core-consumer-node-.*github.run_attempt/);
 assert.match(job('release-seal'),/      - core-source-artifact\n/);
 assert.match(job('release-seal'),/GITHUB_TOKEN: \$\{\{ github.token \}\}/);
 assert.match(job('release-seal'),/XTEND_RELEASE_PUBLISH: \$\{\{ inputs.publish_to_npm \}\}/);
 assert.ok(!source.includes('pull_request_target'));
 for(const name of ['core-source-artifact','pr-fast-gates','full-release-gates','release-prepare','release-seal'])assert.ok(!job(name).includes('id-token:'));
 assert.match(job('npm-publish-latest'),/id-token: write/);
 assert.ok(!job('npm-publish-latest').includes('npm publish'));
});
