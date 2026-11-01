'use strict';
// Controlled protocol fixture. Only source-authority resolution and Linux native
// security execution are scoped doubles; real API identity, ZIP, raw digest,
// installed-lock and lane validators execute. Never release evidence.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const {zip,hash}=require('./union-fixture.cjs'),{installedProof}=require('./contract-proof-fixture.cjs');
const profile=require('../../scripts/release/profile.cjs'),artifactModule=require('../../scripts/release/artifact.cjs');
function scoped(file,overrides){file=path.resolve(__dirname,'../../scripts/release/'+file);const m=new Module(file,module),real=Module.createRequire(file);m.filename=file;m.require=n=>Object.hasOwn(overrides,n)?overrides[n]:real(n);m._compile(fs.readFileSync(file,'utf8'),file);return m.exports;}
async function envelopeFixture(f){
 const artifact=await f.verify(),now=Date.now(),context={runId:'441',runAttempt:'1'},sourceSha=artifact.sourceSha,zeros='a'.repeat(64),repository='konnilabs/xtend',workflow='.github/workflows/xtend-default-gates.yml';
 const expected={profile:profile.PROFILE,producerMode:'committed',sourceSha,archiveSha256:zeros,manifestSha256:zeros,context};
 const provenance={profile:profile.PROFILE,repository,coreSha:sourceSha,archiveSha256:zeros,manifestSha256:zeros,producer:{mode:'committed',implementationSha256:zeros,policySha256:zeros},context,productiveFiles:0,historicalProductiveFiles:0,bindings:[]};
 const candidateAuthority={profile:profile.PROFILE,decisionSha256:zeros,familyId:'xtend.product-candidates',schemaId:'xtend.product-candidates.v2',releasedFingerprintSetHash:null,publicationGuardRetired:false};
 const provider={provenance:()=>structuredClone(provenance),files:()=>[]},loaded={provider,inventorySha256:zeros,policySha256:zeros};
 let sourceChecks=0,securityChecks=0;
 const overrides={'./core-source.cjs':{loadCoreSource:()=>loaded,validateCoreAuthority:()=>{sourceChecks++;return structuredClone(candidateAuthority);}},'./core-security.cjs':{...require('../../scripts/release/core-security.cjs'),verifyCoreSecurityReport:report=>{securityChecks++;if(report.controlledProtocolFixture!==true)throw Error('Wrong controlled security member');}}};
 const auth=scoped('core-auth.cjs',overrides),evidence=scoped('core-evidence.cjs',{'./core-auth.cjs':auth});
 const needs=Object.fromEntries(require('../../scripts/release/github.cjs').gates.map(g=>[g,{result:'success'}]));
 needs['release-prepare'].outputs={manifestIntegrity:artifact.manifestIntegrity,candidateSha256:zeros};
 needs['core-source-artifact'].outputs={'artifact-id':'901','core-sha':sourceSha,'archive-sha256':zeros,'manifest-sha256':zeros};needs['core-security-browser'].outputs={'artifact-id':'904'};
 const env={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:repository,GITHUB_SHA:sourceSha,GITHUB_RUN_ID:context.runId,GITHUB_RUN_ATTEMPT:context.runAttempt,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',GITHUB_WORKFLOW_REF:repository+'/'+workflow+'@refs/heads/main',XTEND_RELEASE_PUBLISH:'true'};
 const run={id:441,run_attempt:1,head_sha:sourceSha,head_branch:'main',event:'workflow_dispatch',repository:{full_name:repository},head_repository:{full_name:repository},workflow_id:16},workflowMetadata={id:16,path:workflow};
 const jobs=['Verify committed Core source artifact','Core security browser (Node 24.18.0)',...profile.lanes.map(n=>'Core installed consumer (Node '+n+')')].map(name=>({name,status:'completed',conclusion:'success',run_id:441,head_sha:sourceSha,run_attempt:1}));
 const metadata=[],bytes=new Map();function add(id,name,entries){const raw=zip(path.join(f.f.directory,'controlled-'+id+'.zip'),entries);bytes.set(id,raw);metadata.push({id,name,expired:false,digest:'sha256:'+hash(raw),workflow_run:{id:441,head_sha:sourceSha}});}
 add(901,'xtend-core-source-441-1',{'sources.tar.gz':Buffer.from('CONTROLLED UNSUITABLE SOURCE; explicit fixture double only')});
 const original=JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json')));
 for(const [i,node] of profile.lanes.entries()){
  const p=installedProof(artifact,original,node);p.report.error=null;p.report.finishedAt=new Date(now).toISOString();
  const sourceReport={format:2,profile:profile.PROFILE,sourceSha,ok:true,validation:{valid:true,errors:[]},productiveSource:provenance,inventorySha256:zeros,policySha256:zeros,candidateAuthority,startedAt:artifact.manifest.preparedAt,finishedAt:new Date(now).toISOString(),schemaSuite:{id:'schema-inventory',ok:true,failures:[],skips:[],report:{profile:profile.PROFILE,inventorySha256:zeros,policySha256:zeros,productiveSource:provenance}}};
  add(902+i,'xtend-core-consumer-node-'+node+'-attempt-1',Object.fromEntries(Object.entries({'consumer.json':p.report,'consumer-lock.json':p.selectedLock,'candidate-sdk-lock.json':p.sdkLock,'source-report.json':sourceReport}).map(([k,v])=>[k,JSON.stringify(v)])));
 }
 add(904,'xtend-core-security-node-24.18.0-attempt-1',{'security-execution.json':JSON.stringify({controlledProtocolFixture:true})});
 const request=async resource=>{if(resource.endsWith('/workflows/xtend-default-gates.yml'))return workflowMetadata;if(/\/attempts\/1$/.test(resource))return run;if(resource.includes('/jobs?'))return {total_count:jobs.length,jobs};if(resource.includes('/artifacts?'))return {total_count:metadata.length,artifacts:metadata};const match=/\/artifacts\/(\d+)(\/zip)?$/.exec(resource);if(match)return match[2]?{status:302,headers:{get:()=>`https://storage.invalid/${match[1]}`}}:metadata.find(m=>String(m.id)===match[1]);throw Error('Unexpected controlled API '+resource);};
 const fetchBytes=async url=>({status:200,arrayBuffer:async()=>bytes.get(Number(new URL(url).pathname.slice(1)))});
 const envelope=await auth.collect({directory:path.join(f.directory,'core-evidence'),artifact,needs,env,request,fetchBytes,now});
 return {envelope,artifact,verify:(value=envelope)=>evidence.verifyCoreEvidenceEnvelope(artifact,value,{directory:f.directory,now}),counts:()=>({sourceChecks,securityChecks}),auth};
}
module.exports={envelopeFixture,scoped};
