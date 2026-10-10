'use strict';
// Controlled API/envelope fixtures. They are neither hosted evidence nor a
// product acceptance. Actual-source tests separately use the canonical archive.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {gates}=require('../../scripts/release/github.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const zip=(file,entries)=>{execFileSync('python3',['-c',`import zipfile,json,base64,sys
z=zipfile.ZipFile(sys.argv[1],'w')
for name,value in json.load(sys.stdin).items():z.writestr(name,base64.b64decode(value))
z.close()`,file],{input:JSON.stringify(Object.fromEntries(Object.entries(entries).map(([n,b])=>[n,Buffer.from(b).toString('base64')])))});return fs.readFileSync(file);};
function fixture(t,{actual=false}={}){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'union-release-fixture-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 let expected={producerMode:'committed',coreSha:'a'.repeat(40),demoSha:'d'.repeat(40),context:{runId:'109101',runAttempt:'1'},archiveSha256:'b'.repeat(64),manifestSha256:'c'.repeat(64)};
 let archive=Buffer.from('CONTROLLED UNSUITABLE SOURCE: must not be production evidence'),provenance={controlled:true};
 if(actual){
  if(!process.env.XTEND_UNION_ARCHIVE||!process.env.XTEND_UNION_EXPECTED)throw Error('Actual committed Sourceartifact required; no skip');
  expected=JSON.parse(fs.readFileSync(process.env.XTEND_UNION_EXPECTED));archive=fs.readFileSync(process.env.XTEND_UNION_ARCHIVE);
  provenance=require('../../tools/schema-inventory/index.cjs').createSourceProvider({archive:process.env.XTEND_UNION_ARCHIVE,expected,destination:path.join(directory,'actual-source')}).provenance();
 }
 const sourceId='902',now=Date.now(),startedAt=new Date(now-1000).toISOString(),finishedAt=new Date(now-500).toISOString();
 const env={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'konnilabs/xtend',GITHUB_SHA:expected.coreSha,GITHUB_RUN_ID:expected.context.runId,
  GITHUB_RUN_ATTEMPT:expected.context.runAttempt,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',
  GITHUB_WORKFLOW_REF:'konnilabs/xtend/.github/workflows/xtend-default-gates.yml@refs/heads/main',XTEND_RELEASE_PUBLISH:'true'};
 const needs=Object.fromEntries(gates.map(name=>[name,{result:'success'}]));
 needs['union-source-artifact']={result:'success',outputs:{'artifact-id':sourceId,'core-sha':expected.coreSha,'demo-sha':expected.demoSha,
  'archive-sha256':expected.archiveSha256,'manifest-sha256':expected.manifestSha256}};
 const run={id:Number(expected.context.runId),run_attempt:Number(expected.context.runAttempt),head_sha:expected.coreSha,head_branch:'main',event:'workflow_dispatch',
  repository:{full_name:'konnilabs/xtend'},head_repository:{full_name:'konnilabs/xtend'},workflow_id:66,run_started_at:new Date(now-2000).toISOString()};
 const workflow={id:66,path:'.github/workflows/xtend-default-gates.yml'};
 const jobs=['Verify pinned union source artifact','Full release gates (Node 24.18.0)','Full release gates (Node 26.5.0)'].map((name,i)=>({id:i+1,name,status:'completed',conclusion:'success',run_id:run.id,run_attempt:run.run_attempt,head_sha:run.head_sha}));
 const bytes=new Map(),reports=new Map(),receipts=new Map(),metadata=[];
 function meta(id,name,raw){const value={id,name,expired:false,digest:'sha256:'+hash(raw),workflow_run:{id:run.id,head_sha:expected.coreSha}};bytes.set(id,raw);metadata.push(value);return value;}
 const producer=meta(Number(sourceId),'xtend-union-source-'+expected.context.runId+'-'+expected.context.runAttempt,zip(path.join(directory,'source.zip'),{'sources.tar.gz':archive}));
 for(const [i,node] of ['24.18.0','26.5.0'].entries()){
  // Deliberately controlled success envelope for policy tests. No actual scan
  // is declared successful here; the separate real-red test substitutes its report.
  const report={startedAt,finishedAt,ok:true,productiveSource:provenance,stats:{controlled:true},validation:{valid:true,errors:[]}};
  const rb=Buffer.from(JSON.stringify(report));
  const receipt={format:1,repository:'konnilabs/xtend',workflow:workflow.path,node,coreSha:expected.coreSha,demoSha:expected.demoSha,
   context:expected.context,sourceArtifactId:sourceId,archiveSha256:expected.archiveSha256,manifestSha256:expected.manifestSha256,
   reportSha256:hash(rb),consumerOutcome:'success'};
  reports.set(node,report);receipts.set(node,receipt);
  meta(903+i,'xtend-release-union-node-'+node.replaceAll('.','-')+'-attempt-'+expected.context.runAttempt,
   zip(path.join(directory,node+'.zip'),{'union-source-validation.json':rb,'union-lane.json':JSON.stringify(receipt)}));
 }
 const calls=[];
 const request=async(resource,options={})=>{
  calls.push(resource);
  if(resource.endsWith('/workflows/xtend-default-gates.yml'))return workflow;
  if(/\/attempts\/\d+$/.test(resource))return run;
  if(resource.includes('/jobs?'))return {total_count:jobs.length,jobs};
  if(resource.includes('/artifacts?'))return {total_count:metadata.length,artifacts:metadata};
  const match=/\/artifacts\/(\d+)(\/zip)?$/.exec(resource);
  if(match){const id=Number(match[1]);if(match[2])return {status:302,headers:{get:()=>`https://storage.invalid/${id}`}};return metadata.find(m=>m.id===id);}
  throw Error('Unexpected controlled API path: '+resource);
 };
 const fetchBytes=async url=>{const raw=bytes.get(Number(new URL(url).pathname.slice(1)));return {status:200,arrayBuffer:async()=>raw};};
 const rebuild=(node)=>{const id=node==='24.18.0'?903:904;const rb=Buffer.from(JSON.stringify(reports.get(node)));receipts.get(node).reportSha256=hash(rb);
  const raw=zip(path.join(directory,'changed-'+node+'.zip'),{'union-source-validation.json':rb,'union-lane.json':JSON.stringify(receipts.get(node))});
  bytes.set(id,raw);metadata.find(m=>m.id===id).digest='sha256:'+hash(raw);};
 return {directory,expected,env,needs,run,workflow,jobs,producer,metadata,bytes,reports,receipts,calls,request,fetchBytes,rebuild,now,
  options:{directory:path.join(directory,'proof'),sourceSha:expected.coreSha,demoSha:expected.demoSha,env,needs,request,fetchBytes,now}};
}
module.exports={fixture,hash,zip};
