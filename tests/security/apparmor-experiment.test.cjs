'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {runnerContext,evidenceTarget,producerOutcome,profileText,present,withTemporaryProfile,validateGate}=require('../../scripts/experiment_browser_apparmor.cjs');
const runner={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_REPOSITORY:'konnilabs/xtend',
  ImageOS:'ubuntu24',RUNNER_OS:'Linux',RUNNER_ARCH:'X64',GITHUB_EVENT_NAME:'workflow_dispatch',
  GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1',RUNNER_TEMP:'/home/runner/work/_temp'};
const ubuntu='ID=ubuntu\nVERSION_ID="24.04"';
test('only disposable explicitly triggered Ubuntu runners qualify',()=>{
  for(const change of [{GITHUB_ACTIONS:'false'},{RUNNER_ENVIRONMENT:'self-hosted'},
    {GITHUB_EVENT_NAME:'pull_request'},{GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/main'},
    {GITHUB_REPOSITORY:'other/repo'},{ImageOS:'ubuntu22'},{RUNNER_ARCH:'ARM64'},
    {GITHUB_RUN_ID:'1\n2'},{GITHUB_RUN_ATTEMPT:'0'}])assert.throws(()=>runnerContext('gate',{...runner,...change},ubuntu));
  assert.throws(()=>runnerContext('gate',runner,'ID=debian\nVERSION_ID="13"'));
  assert.throws(()=>runnerContext('custom-command',runner,ubuntu));
  assert.doesNotThrow(()=>runnerContext('gate',{...runner,GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/experiment/apparmor-userns'},ubuntu));
});
test('profile attachment rejects AppArmor and path injection',()=>{
  const context=runnerContext('gate',runner,ubuntu);
  for(const binary of ['/tmp/**/chrome','/tmp/@{HOME}/chrome','/tmp/"chrome','/tmp/a\nuserns,',
    '/tmp/a\\b/chrome','/tmp/[ab]/chrome','/tmp/{a,b}/chrome','/tmp/../bin/chrome','//tmp/chrome'])
    assert.throws(()=>profileText({...context,binary}));
  assert.throws(()=>profileText({...context,profile:'chrome\nprofile other'}));
  const text=profileText(context);
  assert.ok(text.includes('"/home/runner/work/_temp/xtend-apparmor-browser/chrome-linux64/chrome"'));
  assert.equal((text.match(/profile /g)||[]).length,1);
  assert.equal((text.match(/userns,/g)||[]).length,1);
  assert.ok(!text.includes('include '));
});
test('independent matrix legs and attempts never replace each other',()=>{
  const a=runnerContext('gate',runner,ubuntu),b=runnerContext('execution',runner,ubuntu);
  const c=runnerContext('gate',{...runner,GITHUB_RUN_ATTEMPT:'2'},ubuntu);
  assert.equal(new Set([a.profile,b.profile,c.profile]).size,3);
  assert.equal(present(a.profile+'-other (unconfined)\n',a.profile),false);
  assert.equal(present(a.profile+' (unconfined)\n',a.profile),true);
});
test('cleanup runs after success, assertion failure and partial load failure',async()=>{
  for(const failure of [null,'load','product']){
    const calls=[];
    const action=withTemporaryProfile({
      add:()=>{calls.push('load');if(failure==='load')throw Error('load failed');},
      run:()=>{calls.push('product');if(failure==='product')throw Error('assertion failed');return 42;},
      remove:()=>calls.push('remove')
    });
    if(failure)await assert.rejects(action);else assert.equal(await action,42);
    assert.equal(calls.at(-1),'remove');
    if(failure==='load')assert.deepEqual(calls,['load','remove']);
  }
});
test('cleanup failure cannot turn into successful evidence',async()=>{
  await assert.rejects(withTemporaryProfile({add:()=>{},run:()=>42,remove:()=>{throw Error('profile still loaded');}}),/still loaded/);
});
test('blocked, skipped and contradictory product evidence remains failure',()=>{
  const passed={status:'passed',preflight:{status:'passed'},product:{status:'passed'},cleanup:{status:'passed'}};
  assert.doesNotThrow(()=>validateGate(passed));
  for(const status of ['infrastructure-blocked','not-run','failed','skipped'])
    assert.throws(()=>validateGate({...passed,product:{status}}));
  assert.throws(()=>validateGate({...passed,status:'infrastructure-blocked'}));
});
test('regular gates permit only their exact workflow/job and supported event contexts',()=>{
  for(const mode of ['gate','execution']){
    const workflow=mode==='gate'?'security-scan-regressions.yml':'xtend-default-gates.yml';
    const job=mode==='gate'?'browser-security':'core-security-browser';
    for(const [event,ref] of [['workflow_dispatch','refs/heads/experiment/apparmor-userns'],['push','refs/heads/main'],['pull_request','refs/pull/123/merge']]){
      const env={...runner,GITHUB_EVENT_NAME:event,GITHUB_REF:ref,GITHUB_JOB:job,
        GITHUB_WORKFLOW_REF:'konnilabs/xtend/.github/workflows/'+workflow+'@'+ref};
      const context=runnerContext('regular-'+mode,env,ubuntu);
      assert.equal(context.regular,true);assert.equal(context.producerMode,mode);
      assert.equal(context.binary,'/home/runner/work/_temp/xtend-security-browser/chrome-linux64/chrome');
      assert.notEqual(context.profile,runnerContext(mode,runner,ubuntu).profile);
      const file=evidenceTarget(context,'/ignored');
      assert.ok(file.endsWith(mode==='gate'?'/security-browser-gate.json':'/core-security/security-execution.json'));
      for(const override of [{GITHUB_EVENT_NAME:'pull_request_target'},{GITHUB_JOB:'other'},
        {GITHUB_WORKFLOW_REF:'other'},{GITHUB_REF:'refs/heads/substituted'},{RUNNER_ENVIRONMENT:'self-hosted'}])
        assert.throws(()=>runnerContext('regular-'+mode,{...env,...override},ubuntu));
    }
  }
});
test('regular lifecycle preserves PR-only unavailable coverage without relabeling it as a test pass',()=>{
  const success={status:0,signal:null,abortCause:null,cleanupError:null};
  const unavailable={outcome:'infrastructure-not-executed',browserSecurityCoverage:'unavailable',releaseEligible:false};
  assert.equal(producerOutcome(success),'passed');
  assert.throws(()=>producerOutcome({...success,status:1}));
  assert.equal(producerOutcome({...success,status:1},unavailable),'infrastructure-not-executed');
  assert.throws(()=>producerOutcome(success,unavailable));
  for(const policy of [{...unavailable,releaseEligible:true},{...unavailable,browserSecurityCoverage:'executed'},
    {...unavailable,outcome:'passed'}])assert.throws(()=>producerOutcome({...success,status:1},policy));
  for(const override of [{signal:'SIGTERM'},{abortCause:'timeout'},{cleanupError:'group survived'}])
    assert.throws(()=>producerOutcome({...success,status:1,...override},unavailable));
});
