'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const profiles=require('./execution-profile.cjs'),{capabilities}=require('./adapter.cjs');
const model=()=>({platform:'linux',arch:'x64',node:'24.18.0',uid:1001,env:{GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',
  GITHUB_REPOSITORY:'konnilabs/xtend',GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/qualification/firefox-initial-20261021',XTEND_CI_FUNCTIONAL_PROFILE:profiles.functional}});
test('explicit functional host MODEL only accepts the isolated hosted Linux profile',()=>assert.equal(profiles.requireFunctionalHost(model()),true));
for(const [key,value] of [['platform','darwin'],['arch','arm64'],['node','22.0.0'],['uid',0]])test('functional host rejects '+key,()=>{const m=model();m[key]=value;assert.throws(()=>profiles.requireFunctionalHost(m));});
for(const key of Object.keys(model().env))test('functional host rejects wrong '+key,()=>{const m=model();m.env[key]='other';assert.throws(()=>profiles.requireFunctionalHost(m));});
test('default profile remains sandbox-qualified and arbitrary flags cannot opt in',()=>{
 const opts={engine:'chromium',binary:'/model/chrome',version:'151.0.7922.173'};
 assert.deepEqual(capabilities({...opts,args:['--no-sandbox']}).capabilities.alwaysMatch['goog:chromeOptions'].args,['--headless=new']);
 assert.throws(()=>capabilities({...opts,executionProfile:'auto'}));
 assert.throws(()=>capabilities({...opts,engine:'firefox',executionProfile:profiles.functional}));
});
test('browser/driver environment is an exact credential-free allowlist',()=>{
 const old=process.env.GITHUB_TOKEN;process.env.GITHUB_TOKEN='MODEL_SECRET_DO_NOT_INHERIT';
 try{assert.deepEqual(profiles.childEnvironment('/private/model'),{PATH:'/usr/bin:/bin',TMPDIR:'/private/model',HOME:'/private/model',LANG:'C.UTF-8'});}
 finally{if(old===undefined)delete process.env.GITHUB_TOKEN;else process.env.GITHUB_TOKEN=old;}
});

test('both approved Node lanes pass the hosted functional MODEL',()=>{for(const node of profiles.nodes){const m=model();m.node=node;assert.equal(profiles.requireFunctionalHost(m),true);}});
