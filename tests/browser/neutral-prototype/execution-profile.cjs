'use strict';
const assert=require('node:assert/strict');
const functional='chromium-linux-ci-functions-no-sandbox-v1',qualified='sandbox-qualified';
const nodes=Object.freeze(['24.18.0','26.5.0']);
function validate(value=qualified,engine) {
  assert([qualified,functional].includes(value),'Unknown browser execution profile');
  if(value===functional)assert.equal(engine,'chromium','Functional opt-in is Chromium only');
  return value;
}
function requireFunctionalHost(context={platform:process.platform,arch:process.arch,node:process.versions.node,uid:process.getuid?.(),env:process.env}) {
  const {platform,arch,node,uid,env}=context;
  assert.equal(platform,'linux');assert.equal(arch,'x64');assert(nodes.includes(node),'Pinned functional Node required');assert(Number.isInteger(uid)&&uid>0);
  assert.equal(env.GITHUB_ACTIONS,'true');assert.equal(env.RUNNER_ENVIRONMENT,'github-hosted');
  assert.equal(env.GITHUB_REPOSITORY,'konnilabs/xtend');assert.equal(env.GITHUB_EVENT_NAME,'push');
  assert.equal(env.GITHUB_REF,'refs/heads/qualification/firefox-initial-20261021');
  assert.equal(env.XTEND_CI_FUNCTIONAL_PROFILE,functional,'Explicit workflow opt-in required');
  return true;
}
function childEnvironment(tmp) {
  assert(typeof tmp==='string'&&tmp.startsWith('/'));
  // Deliberate allowlist: no inherited tokens, credentials, flags or preferences.
  return {PATH:'/usr/bin:/bin',TMPDIR:tmp,HOME:tmp,LANG:'C.UTF-8'};
}
module.exports={functional,qualified,nodes,validate,requireFunctionalHost,childEnvironment};
