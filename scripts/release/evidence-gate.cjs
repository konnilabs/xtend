'use strict';
const path=require('node:path');
const {createSuiteContext}=require('../../tests/utils/assertions');
async function runCoreEvidenceGate({rootDir}) {
  const context=createSuiteContext({id:'core-release-evidence',label:'Required immutable Core release evidence'});
  try {
    require('../scan_schema_inventory').assertCandidateInitialAuthorityRetiredForRelease();
    if(!process.env.XTEND_RELEASE_ARTIFACT||!process.env.XTEND_RELEASE_MANIFEST_INTEGRITY||!process.env.GITHUB_SHA)
      throw Error('Required sealed Core artifact/source/hash inputs absent');
    const artifact=await require('./artifact.cjs').verifyArtifact({directory:path.resolve(process.env.XTEND_RELEASE_ARTIFACT),
      manifestIntegrity:process.env.XTEND_RELEASE_MANIFEST_INTEGRITY,sourceSha:process.env.GITHUB_SHA,rootDir,phase:'sealed'});
    if(require('./release-evidence.cjs').evidenceContract(artifact)!==require('./profile.cjs').PROFILE)
      throw Error('ci-publish requires the exact Core release profile');
    await require('./release-evidence.cjs').verifyPublicationEvidence(artifact);
    context.assert(true,'Both authenticated Core lanes, source/projection and all required gates are bound to sealed bytes');
  } catch(error){context.fail(error.message);}
  return context.result();
}
module.exports={runCoreEvidenceGate};
