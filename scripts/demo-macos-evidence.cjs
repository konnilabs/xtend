'use strict';
// Explicit external local macOS execution, never a Linux/hosted execution claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const nodes=Object.freeze(['24.18.0','26.5.0']);
const stages=Object.freeze(['preparation-protocol','contracts','build','layout','catfood','embedded-runtime','native-runtime','shell-worker']);
const sourcePaths=Object.freeze(['src/main/electron-main.mjs','src/main/preload.cjs','src/renderer/app-controller.mjs','src/main/app-server.mjs','src/main/app-server-session.mjs','site/index.html','scripts/electron-sandbox-policy.mjs']);
const executableSha256='ce9ddadbb1981cd08af38fe2b1ec5cc3b810a8acdee14fcf4b7285854104f605';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function verify(evidence,expected) {
  assert.equal(evidence.format,1);assert.equal(evidence.kind,'actual-local-macos-execution');
  assert.equal(evidence.coreSha,expected.coreSha);assert.equal(evidence.demoSha,expected.demoSha);
  assert(/^[a-f0-9]{40}$/.test(evidence.coreSha)&&/^[a-f0-9]{40}$/.test(evidence.demoSha));
  assert.equal(evidence.platform,'darwin');assert.equal(evidence.arch,'arm64');
  assert.equal(evidence.linuxRuntime,'not-run');assert.equal(evidence.hostedRuntime,'not-run');
  assert.equal(evidence.acceptedForMerge,false);assert.equal(evidence.acceptedForRelease,false);
  assert.equal(evidence.lanes.length,2);const seen=new Set();
  for(const lane of evidence.lanes) {
    assert(nodes.includes(lane.node)&&!seen.has(lane.node),'Missing/duplicate/foreign macOS lane');seen.add(lane.node);
    assert.equal(lane.electron,'42.10.0');assert.equal(lane.embeddedNode,'24.18.1');
    assert.equal(lane.worker,'explicitly-simulated');
    assert.deepEqual(lane.stages.map(x=>x.name),stages);
    for(const row of lane.stages) {
      assert.equal(row.exitCode,0);assert.equal(row.timedOut,false);assert.equal(row.executed,true);
      assert(row.cleanup?.childReaped&&row.cleanup?.groupGone&&row.cleanup?.complete);
      assert.deepEqual(row.cleanup.remaining,[]);
      assert(Number.isFinite(Date.parse(row.startedAt))&&Date.parse(row.finishedAt)>=Date.parse(row.startedAt));
      assert(/^[a-f0-9]{64}$/.test(row.logSha256||''),'Missing raw execution digest');
    }
    const a=lane.application;
    assert.equal(a.proofKind,'actual-application-main-frame');assert.equal(a.mainFrameAttestation,true);
    assert.equal(a.coreSha,expected.coreSha);assert.equal(a.demoSha,expected.demoSha);
    assert.equal(a.sandboxed,true);assert.equal(a.contextIsolated,true);assert.equal(a.nodeIntegration,false);assert.equal(a.sandboxPreference,true);
    assert.equal(a.rendererSeccomp,null,'Do not assert Linux proof on macOS');
    assert(Number.isInteger(a.applicationUid)&&a.applicationUid>0&&Number.isInteger(a.rendererPid)&&a.rendererPid>0);
    assert.equal(a.runtimeIdentity.attestationMode,'local');assert.equal(a.runtimeIdentity.electronVersion,'42.10.0');assert.equal(a.runtimeIdentity.executableSha256,executableSha256);
    assert.deepEqual(Object.keys(a.sources).sort(),[...sourcePaths].sort());assert.deepEqual(a.sources,expected.sourceHashes);
    const layout=lane.stages.find(x=>x.name==='layout');assert(Date.parse(a.generatedAt)>=Date.parse(layout.startedAt)&&Date.parse(a.generatedAt)<=Date.parse(layout.finishedAt),'Stale application proof');
    assert(/^[a-f0-9]{64}$/.test(lane.applicationRawSha256||''));
    assert.equal(lane.catfoodChecks,19);assert.equal(lane.embeddedChecks,10);
  }
  return {format:1,status:'passed',kind:'verified-external-local-macos-execution',coreSha:expected.coreSha,demoSha:expected.demoSha,nodes:[...seen].sort(),linuxRuntime:'not-run',hostedRuntime:'not-run',newRuntimeExecution:false,acceptedForMerge:false,acceptedForRelease:false};
}
function fromFiles(controller,demo,receipt,output) {
  const pin=JSON.parse(fs.readFileSync(path.join(controller,'product-demos.lock.json')));
  const git=(...args)=>execFileSync('git',['-C',demo,...args]);
  assert.equal(git('rev-parse','HEAD').toString().trim(),pin.demoSha);
  const sourceHashes=Object.fromEntries(sourcePaths.map(file=>[file,hash(git('show',pin.demoSha+':products/xtend-llm/'+file))]));
  const bytes=fs.readFileSync(receipt);
  const result=verify(JSON.parse(bytes),{coreSha:pin.implementationCoreSha,demoSha:pin.demoSha,sourceHashes});
  result.receiptSha256=hash(bytes);result.recordedInController=execFileSync('git',['-C',controller,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');return result;
}
if(require.main===module){try{const [controller,demo,receipt,output]=process.argv.slice(2);fromFiles(controller,demo,receipt,output);}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={nodes,stages,sourcePaths,executableSha256,verify,fromFiles};
