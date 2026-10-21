'use strict';
// Migration-only decision. The release guard and its security contracts do not import this module.
const fs=require('node:fs'),assert=require('node:assert/strict');
const reviewed=require('../development/migration-functional-acceptance.json');
const matrix=require('../tests/browser/neutral-prototype/functional-matrix.cjs');
const contract=require('../tests/browser/neutral-prototype/result-contract.cjs');
function evaluate(directory,expected,decision=reviewed){
  assert.deepEqual(decision,reviewed,'Exact reviewed migration decision required');
  assert.equal(decision.status,'user-approved-functional-evidence');
  const functions=matrix.load(directory,expected);
  assert.equal(functions.status,'passed','Both real functional lanes must pass');
  assert.equal(functions.sandboxEnabled,false);assert.equal(functions.sandboxEvidence,'not-provided');
  assert.deepEqual(functions.profiles.map(p=>p.node).sort(),decision.nodeLanes.slice().sort());
  return {format:1,purpose:decision.purpose,source:expected.source,runId:expected.runId,attempt:expected.attempt,
    decisionSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(require.resolve('../development/migration-functional-acceptance.json'))).digest('hex'),
    browserFunctionsAcceptedForMigration:true,browserFunctionEvidence:functions,
    sandboxEnabled:false,sandboxEvidence:'not-provided',generalBrowserSupport:'not-accepted',
    remainingMigrationConditions:decision.remainingMigrationConditions,
    migrationComplete:false,userMergeDecision:'pending',acceptedForSecurity:false,acceptedForMerge:false,acceptedForRelease:false};
}
if(require.main===module){
  const [directory,output]=process.argv.slice(2);let result;
  try{
    assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.GITHUB_EVENT_NAME,'push');
    assert.equal(process.env.GITHUB_REPOSITORY,'konnilabs/xtend');
    const head=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(head,process.env.GITHUB_SHA);
    result=evaluate(directory,{repository:process.env.GITHUB_REPOSITORY,source:{type:'committed',commit:head},runId:process.env.GITHUB_RUN_ID,
      attempt:Number(process.env.GITHUB_RUN_ATTEMPT),kind:'live-session',contractSha256:contract.contractDigest()});
  }catch(error){result={browserFunctionsAcceptedForMigration:false,migrationComplete:false,reason:error.message,acceptedForMerge:false,acceptedForRelease:false};process.exitCode=1;}
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}
module.exports={evaluate};
