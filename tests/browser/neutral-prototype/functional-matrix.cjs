'use strict';
// Consumes same-run Actions artifacts. Never starts a browser or grants merge/release.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const contract=require('./result-contract.cjs'),profiles=require('./execution-profile.cjs');
const {pin}=require('../../security/sandboxed-browser.cjs');
function load(directory,expected){
  assert.equal(expected.repository,'konnilabs/xtend');assert.equal(expected.source?.type,'committed');
  assert.equal(expected.kind,'live-session');assert(/^[1-9]\d*$/.test(expected.runId));assert.equal(expected.attempt,1);
  const names=profiles.nodes.map(node=>`chromium-functional-${expected.runId}-${expected.attempt}-${node}`).sort();
  assert.deepEqual(fs.readdirSync(directory).sort(),names,'Exactly both same-run lane artifacts required');
  const records=[],plans=[],bindings=[];
  for(const name of names){
    const root=path.join(directory,name);assert(fs.lstatSync(root).isDirectory()&&!fs.lstatSync(root).isSymbolicLink());
    const read=file=>{const p=path.join(root,file);assert(fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink());return JSON.parse(fs.readFileSync(p));};
    const summary=read('summary.json'),raw=read('report.json'),terminal=read('job-terminal.json'),provision=read('provisioning.json');
    assert.equal(name,`chromium-functional-${summary.runId}-${summary.attempt}-${summary.node}`);
    assert.equal(summary.node,terminal.node);assert.equal(summary.sessionCreationRequests,1);
    assert.equal(summary.sessionId,summary.observation?.provenance.sessionId);assert.deepEqual(summary.source,expected.source);
    assert.equal(summary.runId,expected.runId);assert.equal(summary.attempt,expected.attempt);
    for(const item of [summary,terminal]){
      assert.equal(item.acceptedForMerge,false);assert.equal(item.acceptedForRelease,false);assert.equal(item.sandboxEnabled,false);
    }
    assert.equal(terminal.mode,'ci-functional-only');assert.equal(terminal.sandboxEvidence,'not-provided');
    assert(['install','runtime','controls','provision','browser'].every(id=>terminal.outcomes[id]==='success'),'Incomplete workflow execution');
    assert.equal(summary.mapping.status,'passed');assert.equal(summary.status,summary.observation.status);
    assert.deepEqual(provision.archives,pin.archives);assert.equal(provision.version,pin.version);
    assert.equal(summary.observation.profile.browserVersion,pin.version);assert.equal(summary.observation.profile.driverVersion,pin.version);
    assert.equal(raw.browserSha256,provision.executables['chrome-linux64/chrome']);
    assert.equal(raw.driverSha256,provision.executables['chromedriver-linux64/chromedriver']);
    records.push({raw,observation:summary.observation});plans.push(summary.observation.profile);
    bindings.push({profileId:summary.observation.profile.id+'/'+summary.node,observationSha256:contract.hash(summary.observation),rawSha256:contract.hash(raw)});
  }
  const result=contract.aggregateFunctional({profiles:plans,records,expected,authenticatedBindings:bindings});
  return {...result,source:expected.source,runId:expected.runId,attempt:expected.attempt,
    transportAuthentication:'same-run Actions artifact download; expected event head/run/attempt supplied externally'};
}
if(require.main===module){
  const [directory,output]=process.argv.slice(2);let result;
  try{result=load(directory,{repository:process.env.GITHUB_REPOSITORY,source:{type:'committed',commit:process.env.GITHUB_SHA},
    runId:process.env.GITHUB_RUN_ID,attempt:Number(process.env.GITHUB_RUN_ATTEMPT),kind:'live-session',contractSha256:contract.contractDigest()});}
  catch(error){result={status:'failed',reason:error.message,acceptedForMerge:false,acceptedForRelease:false,sandboxEnabled:false,sandboxEvidence:'not-provided'};}
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(result.status!=='passed')process.exitCode=1;
}
module.exports={load};
