'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {PROFILE,lanes,gates}=require('./profile.cjs');
const {check}=require('./inventory.cjs');
const {artifactFile,digest}=require('./artifact.cjs');
const auth=require('./github.cjs');
const {loadCoreSource,validateCoreAuthority}=require('./core-source.cjs');
const security=require('./core-security.cjs');
const repository='konnilabs/xtend',workflow='.github/workflows/xtend-default-gates.yml';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function context({sourceSha,artifact,env=process.env,needs}) {
  check(env.GITHUB_ACTIONS==='true'&&env.GITHUB_REPOSITORY===repository&&env.GITHUB_SHA===sourceSha&&
    env.GITHUB_EVENT_NAME==='workflow_dispatch'&&env.GITHUB_REF==='refs/heads/main'&&env.XTEND_RELEASE_PUBLISH==='true'&&
    env.GITHUB_WORKFLOW_REF===repository+'/'+workflow+'@refs/heads/main'&&
    /^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID||'')&&/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ATTEMPT||''),
    'Core seal requires exact trusted main/run/attempt/source identity');
  auth.verifyNeeds(needs);
  check(needs['release-prepare'].outputs?.manifestIntegrity===artifact.manifestIntegrity&&
    /^[a-f0-9]{64}$/.test(needs['release-prepare'].outputs?.candidateSha256||''),
    'Core seal input differs from current preparation/resume outputs');
  const outputs=needs['core-source-artifact'].outputs;
  check(outputs?.['core-sha']===sourceSha&&/^[1-9][0-9]*$/.test(outputs['artifact-id']||'')&&
    /^[a-f0-9]{64}$/.test(outputs['archive-sha256']||'')&&/^[a-f0-9]{64}$/.test(outputs['manifest-sha256']||''),
    'Core producer outputs missing or substituted');
  return {runId:env.GITHUB_RUN_ID,runAttempt:env.GITHUB_RUN_ATTEMPT,sourceSha,sourceArtifactId:outputs['artifact-id'],
    expected:{profile:PROFILE,producerMode:'committed',sourceSha,archiveSha256:outputs['archive-sha256'],
      manifestSha256:outputs['manifest-sha256'],context:{runId:env.GITHUB_RUN_ID,runAttempt:env.GITHUB_RUN_ATTEMPT}}};
}
function sourceName(ctx){return 'xtend-core-source-'+ctx.runId+'-'+ctx.runAttempt;}
function laneName(node,ctx){return 'xtend-core-consumer-node-'+node+'-attempt-'+ctx.runAttempt;}
function securityName(ctx){return 'xtend-core-security-node-'+security.node+'-attempt-'+ctx.runAttempt;}
function verifyStoredAuthentication(envelope,{directory,artifact}) {
  const ctx={...envelope.context,sourceSha:artifact.sourceSha},source=envelope.source;
  check(source?.expected?.profile===PROFILE&&source.expected.sourceSha===artifact.sourceSha&&
    isDeepStrictEqual(source.expected.context,envelope.context),'Core source expected identity mismatch');
  auth.checkRun(envelope.run,envelope.workflowMetadata,ctx);auth.checkJobsEndpoint(envelope.jobsEndpoint,ctx);
  auth.checkJob(envelope.jobs,'Verify committed Core source artifact',ctx);
  auth.checkJob(envelope.jobs,security.job,ctx);
  auth.checkMetadata(source.metadata,sourceName(ctx),ctx);
  const producer=envelope.needs['core-source-artifact'].outputs;
  check(String(source.metadata.id)===producer['artifact-id']&&producer['core-sha']===artifact.sourceSha&&
    producer['archive-sha256']===source.expected.archiveSha256&&producer['manifest-sha256']===source.expected.manifestSha256,
    'Stored Core source proof differs from authenticated producer outputs');
  const work=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'xtend-core-proof-')));
  try {
    const zip=artifactFile(directory,source.file);
    check('sha256:'+hash(fs.readFileSync(zip))===source.metadata.digest,'Core source archive substitution');
    auth.extract(zip,path.join(work,'source-transport'),['sources.tar.gz']);
    const loaded=loadCoreSource({archive:path.join(work,'source-transport/sources.tar.gz'),destination:path.join(work,'source'),expected:source.expected});
    check(isDeepStrictEqual(loaded.provider.provenance(),source.provenance)&&loaded.inventorySha256===source.inventorySha256&&
      loaded.policySha256===source.policySha256,'Core projection/source provenance mismatch');
    const authority=validateCoreAuthority({...loaded,rootDir:path.resolve(__dirname,'../..'),typescript:require('typescript')});
    check(isDeepStrictEqual(authority,source.candidateAuthority),'Stored Core authority decision differs from authenticated source/scan');
    const proof=envelope.security;
    check(proof?.node===security.node&&proof.job===security.job&&proof.archive==='core-evidence/security.zip'&&
      proof.report?.file==='core-evidence/security/security-execution.json',
      'Required single Node24 security raw report binding missing/changed');
    auth.checkMetadata(proof.metadata,securityName(ctx),ctx);
    check(String(proof.metadata.id)===envelope.needs[security.id].outputs?.['artifact-id'],
      'Core security artifact differs from required successful job output');
    const securityZip=artifactFile(directory,proof.archive);
    check('sha256:'+hash(fs.readFileSync(securityZip))===proof.metadata.digest,'Core security archive substitution');
    const securityRoot=path.join(work,'security');auth.extract(securityZip,securityRoot,['security-execution.json']);
    const reportBytes=fs.readFileSync(path.join(securityRoot,'security-execution.json'));
    check(digest(reportBytes)===proof.report.integrity&&reportBytes.equals(fs.readFileSync(artifactFile(directory,proof.report.file))),
      'Core security raw report differs from authenticated same-run/attempt artifact');
    security.verifyCoreSecurityReport(JSON.parse(reportBytes),{artifact,envelope,provider:loaded.provider,now:Date.parse(envelope.sealedAt)});
    for(const node of lanes) {
      const lane=envelope.lanes.find(item=>item.node===node);check(lane,'Missing authenticated Core lane');
      auth.checkJob(envelope.jobs,'Core installed consumer (Node '+node+')',ctx);auth.checkMetadata(lane.metadata,laneName(node,ctx),ctx);
      const laneZip=artifactFile(directory,lane.archive);
      check('sha256:'+hash(fs.readFileSync(laneZip))===lane.metadata.digest,'Core consumer archive substitution');
      const target=path.join(work,node);auth.extract(laneZip,target,['consumer.json','consumer-lock.json','candidate-sdk-lock.json','source-report.json']);
      for(const [binding,name] of [[lane.consumer,'consumer.json'],[lane.lock,'consumer-lock.json'],[lane.candidateSDKLock,'candidate-sdk-lock.json'],[lane.sourceReport,'source-report.json']])
        check(digest(fs.readFileSync(path.join(target,name)))===binding.integrity&&
          fs.readFileSync(path.join(target,name)).equals(fs.readFileSync(artifactFile(directory,binding.file))),
          'Core raw lane member differs from authenticated same-attempt archive');
    }
    loaded.provider.files();
    return true;
  } finally {fs.rmSync(work,{recursive:true,force:true});}
}
async function collect({directory,artifact,needs,env=process.env,request=auth.githubRequest(),fetchBytes=fetch,now=Date.now()}) {
  const ctx=context({sourceSha:artifact.sourceSha,artifact,env,needs});check(!fs.existsSync(directory),'Fresh Core evidence destination required');
  const run=await request(`/repos/${repository}/actions/runs/${ctx.runId}/attempts/${ctx.runAttempt}`);
  const workflowMetadata=await request(`/repos/${repository}/actions/workflows/xtend-default-gates.yml`);
  auth.checkRun(run,workflowMetadata,ctx);
  const jobsEndpoint=auth.jobsResource(ctx),jobs=await auth.pages(request,jobsEndpoint,'jobs');
  auth.checkJob(jobs,'Verify committed Core source artifact',ctx);
  auth.checkJob(jobs,security.job,ctx);
  for(const node of lanes)auth.checkJob(jobs,'Core installed consumer (Node '+node+')',ctx);
  const metadata=await request(`/repos/${repository}/actions/artifacts/${ctx.sourceArtifactId}`);auth.checkMetadata(metadata,sourceName(ctx),ctx);
  const available=await auth.pages(request,`/repos/${repository}/actions/runs/${ctx.runId}/artifacts`,'artifacts');
  fs.mkdirSync(directory,{recursive:true});
  const temporary=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'xtend-core-collect-')));
  try {
    await auth.download(metadata,path.join(directory,'source.zip'),request,fetchBytes);
    auth.extract(path.join(directory,'source.zip'),path.join(temporary,'producer'),['sources.tar.gz']);
    const loaded=loadCoreSource({archive:path.join(temporary,'producer/sources.tar.gz'),destination:path.join(temporary,'source'),expected:ctx.expected});
    const candidateAuthority=validateCoreAuthority({...loaded,rootDir:path.resolve(__dirname,'../..'),typescript:require('typescript')});
    const envelope={schema:'xtend.release.core-evidence.v1',profile:PROFILE,repository,workflow,sourceSha:artifact.sourceSha,
      context:{runId:ctx.runId,runAttempt:ctx.runAttempt},sealedAt:new Date(now).toISOString(),needs,
      candidateIntegrity:artifact.manifest.candidateBinding.integrity,buildIntegrity:artifact.manifest.buildEvidence.integrity,
      tarballSetIntegrity:artifact.tarballSetIntegrity,requiredGates:Object.fromEntries(gates.map(gate=>[gate,'success'])),
      run,workflowMetadata,jobsEndpoint,jobs,source:{expected:ctx.expected,metadata,file:'core-evidence/source.zip',
        candidateAuthority,provenance:loaded.provider.provenance(),inventorySha256:loaded.inventorySha256,policySha256:loaded.policySha256},lanes:[]};
    for(const node of lanes) {
      const matches=available.filter(row=>row.name===laneName(node,ctx));check(matches.length===1,'Missing/duplicate Core consumer artifact');
      auth.checkMetadata(matches[0],laneName(node,ctx),ctx);
      const zip=node+'.zip';await auth.download(matches[0],path.join(directory,zip),request,fetchBytes);
      const target=path.join(temporary,node);auth.extract(path.join(directory,zip),target,['consumer.json','consumer-lock.json','candidate-sdk-lock.json','source-report.json']);
      fs.mkdirSync(path.join(directory,node));
      const bindings={};
      for(const [key,name] of [['consumer','consumer.json'],['lock','consumer-lock.json'],['candidateSDKLock','candidate-sdk-lock.json'],['sourceReport','source-report.json']]) {
        const bytes=fs.readFileSync(path.join(target,name));fs.writeFileSync(path.join(directory,node,name),bytes,{flag:'wx'});
        bindings[key]={file:'core-evidence/'+node+'/'+name,integrity:digest(bytes)};
      }
      envelope.lanes.push({node,metadata:matches[0],archive:'core-evidence/'+zip,...bindings});
    }
    const securityMatches=available.filter(row=>row.name===securityName(ctx));
    check(securityMatches.length===1,'Missing/duplicate mandatory Core security artifact');
    auth.checkMetadata(securityMatches[0],securityName(ctx),ctx);
    check(String(securityMatches[0].id)===needs[security.id].outputs?.['artifact-id'],
      'Core security artifact differs from required job output');
    await auth.download(securityMatches[0],path.join(directory,'security.zip'),request,fetchBytes);
    const securityRoot=path.join(temporary,'security');
    auth.extract(path.join(directory,'security.zip'),securityRoot,['security-execution.json']);
    const reportBytes=fs.readFileSync(path.join(securityRoot,'security-execution.json'));
    security.verifyCoreSecurityReport(JSON.parse(reportBytes),{artifact,envelope,provider:loaded.provider,now});
    fs.mkdirSync(path.join(directory,'security'));
    fs.writeFileSync(path.join(directory,'security/security-execution.json'),reportBytes,{flag:'wx'});
    envelope.security={node:security.node,job:security.job,metadata:securityMatches[0],archive:'core-evidence/security.zip',
      report:{file:'core-evidence/security/security-execution.json',integrity:digest(reportBytes)}};
    loaded.provider.files();
    fs.writeFileSync(path.join(directory,'index.json'),JSON.stringify(envelope,null,2)+'\n',{flag:'wx'});return envelope;
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
}
module.exports={collect,verifyStoredAuthentication};
