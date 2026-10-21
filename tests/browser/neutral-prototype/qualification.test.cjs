'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {endpoint,connect}=require('./bidi.cjs');
const {parseStat,parseStatus,processRole,Continuity,validateContent}=require('./linux-observer.cjs');
const {diagnosticDriverLog}=require('./run-firefox.cjs');
const {pinned,hydrangeaPreload,negativeLifecycle}=require('./qualification.cjs');
const contracts=require('./fixture-contracts.json');
const owner={assertCurrent(){}};
class Socket extends EventTarget {
  constructor(){super();queueMicrotask(()=>this.dispatchEvent(new Event('open')));}
  send(raw){const input=JSON.parse(raw);queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(input.method==='fail'?{type:'error',id:input.id,error:'invalid argument',message:'fixture'}:{type:'success',id:input.id,result:{echo:input.params}})})));}
  close(){queueMicrotask(()=>this.dispatchEvent(new Event('close')));}
}
test('BiDi endpoint rejects remote, wrong-session, credentials and alternate paths',()=>{
  assert.equal(endpoint('ws://127.0.0.1:123/session/id','id'),'ws://127.0.0.1:123/session/id');
  for(const url of ['ws://localhost:123/session/id','wss://127.0.0.1/session/id','ws://127.0.0.1:123/session/foreign','ws://u:p@127.0.0.1:123/session/id','ws://127.0.0.1:123/session/id?q=1'])assert.throws(()=>endpoint(url,'id'));
});
test('BiDi correlates responses, preserves command errors, and acknowledges close',async()=>{
  const client=await connect('ws://127.0.0.1:123/session/id','id',owner,100,Socket);
  assert.deepEqual(await client.command('good',{contexts:['one']}),{echo:{contexts:['one']}});
  await assert.rejects(client.command('fail'),/invalid argument/);assert.equal((await client.close()).closed,true);
});
test('BiDi pending commands time out and cannot become success',async()=>{
  class Silent extends Socket {send(){}}
  const client=await connect('ws://127.0.0.1:123/session/id','id',owner,20,Silent);
  await assert.rejects(client.command('silent'),/deadline/);await assert.rejects(client.command('next'),/deadline/);await client.close();
});
test('BiDi refuses lost ownership before sending',async()=>{
  let valid=true;const scoped={assertCurrent(){if(!valid)throw Error('ownership lost');}};
  const client=await connect('ws://127.0.0.1:123/session/id','id',scoped,100,Socket);valid=false;
  await assert.rejects(client.command('good'),/ownership lost/);await client.close();
});
test('BiDi ownership loss while receiving rejects the pending response without hanging',async()=>{
  let valid=true;
  class LostOnReply extends Socket {send(raw){valid=false;super.send(raw);}}
  const scoped={assertCurrent(){if(!valid)throw Error('reply ownership lost');}};
  const client=await connect('ws://127.0.0.1:123/session/id','id',scoped,100,LostOnReply);
  await assert.rejects(client.command('good'),/reply ownership lost/);await client.close();
});
test('Linux proc parser binds start identity and rejects incomplete security fields',()=>{
  const fields=['S','10','20','20',...Array(15).fill('0'),'1234'];
  assert.equal(parseStat('20 (name with ) spaces) '+fields.join(' '),20).start,'1234');
  assert.throws(()=>parseStat('99 (wrong) '+fields.join(' '),20));
  const text='Uid:\t501\t501\t501\t501\nNoNewPrivs:\t1\nSeccomp:\t2\nSeccomp_filters:\t1\nCapEff:\t0000000000000000';
  assert.equal(parseStatus(text).seccomp,2);assert.throws(()=>parseStatus(text.replace('Seccomp_filters:\t1','')));
});
const leader={pid:20,parent:1,group:20,session:20,start:'100',state:'S'};
test('Firefox NUL argv and official forkserver joined titles identify exact roles',()=>{
  for(const separator of ['\0',' '])for(const role of ['tab','socket','rdd','gpu','utility','gmplugin','vr','forkserver']){
    const result=processRole(['/opt/firefox/firefox-bin','-contentproc','-prefsHandle','123','10',role].join(separator)+'\0');
    assert.equal(result.role,role);assert.equal(result.contentProcess,role==='tab');
    assert.equal(result.format,separator==='\0'?'nul-argv':'joined-title');
  }
  assert.equal(processRole('/opt/test browser/firefox-bin\0-contentproc\0tab\0').contentProcess,true);
});
test('Role matcher rejects absent, truncated, duplicate, mixed and ambiguous role markers',()=>{
  for(const value of ['', '/opt/firefox/firefox-bin -contentproc tab', 'Web Content\0',
    '/opt/firefox/firefox-bin -contentproc tab utility\0','/opt/firefox/firefox-bin -contentproc utility tab\0',
    '/opt/firefox/firefox-bin -contentproc -contentproc tab\0','/opt/firefox/firefox-bin --contentproc tab\0',
    '/opt/test browser/firefox-bin -contentproc tab\0','/opt/firefox/firefox-bin -contentproc  tab\0',
    '/opt/firefox/firefox-bin\0-contentproc\0tab\0unexpected\0','/opt/firefox/firefox-bin\0-contentproc\0socket tab\0',
    '/opt/firefox/firefox-bin\0-contentproc\0tab\n\0'])assert.equal(processRole(value).contentProcess,false);
});
test('Driver diagnostic artifacts omit argv, environment and unclassified page output',()=>{
  const output=diagnosticDriverLog('[31] Sandbox: CanCreateUserNamespace() unshare(CLONE_NEWPID): EPERM\n'+
    '1792587215396\tMarionette\tINFO\tListening on port 1234\n'+
    'Running command: /browser --secret=value\nTOKEN=private-value\nconsole.log(private-value)\n');
  assert.match(output,/EPERM/);assert.match(output,/Listening on port 1234/);
  assert(!/private-value|secret|TOKEN|Running command|console.log/.test(output));assert.match(output,/omitted: 3/);
});
test('Linux continuity survives observed child handoff but never reseeds a reused group',()=>{
  const child={...leader,pid:21,parent:20,start:'101'};const tracker=new Continuity(leader);
  tracker.observe([leader,child]);tracker.observe([child]);
  assert.throws(()=>tracker.observe([{...child,start:'999'}]),/continuity/);
  assert.throws(()=>tracker.observe([{...leader,start:'999'}]),/reused/);
  assert.throws(()=>tracker.observe([]),/observable/);
  assert.throws(()=>tracker.observe([{...child,session:1}]),/mismatch/);
});
test('Zombie and unknown-live transitions never become ownership witnesses',()=>{
  const tracker=new Continuity(leader),child={...leader,pid:21,parent:20,start:'101'};
  tracker.observe([leader,child]);
  assert.throws(()=>tracker.observe([{...leader,state:'Z'},{...child,state:'Z'}]),/continuity/);
  assert.throws(()=>tracker.observe([{...leader,state:'Z'},{...child,pid:22,start:'102'}]),/continuity/);
});
const security={uids:[501,501,501,501],seccomp:2,noNewPrivs:1,filters:2,capEff:'0000000000000000'};
const browser={...leader,security:{...security,filters:1}};
const content={...leader,pid:21,start:'101',contentProcess:true,executable:'/browser/firefox',threads:[security]};
test('Linux content proof requires extra filters on every thread beyond inherited host filters',()=>{
  assert.equal(validateContent([content],browser,501,['/browser/firefox']).length,1);
  for(const change of [{seccomp:0},{noNewPrivs:0},{filters:1},{uids:[0,0,0,0]},{capEff:'1'}])
    assert.throws(()=>validateContent([{...content,threads:[security,{...security,...change}]}],browser,501,['/browser/firefox']));
  assert.throws(()=>validateContent([],browser,501,['/browser/firefox']));
  assert.throws(()=>validateContent([{...content,threads:[]}],browser,501,['/browser/firefox']));
  assert.throws(()=>validateContent([{...content,executable:'/foreign'}],browser,501,['/browser/firefox']));
});
test('Pinned maintained fixtures and Hydrangea preload remain byte-bound',()=>{
  for(const f of contracts.fixtures)assert(pinned(f).includes(f.resultKey));
  assert(hydrangeaPreload().includes('finally { state.active--; entry.finished = performance.now(); }'));
  assert.throws(()=>pinned({...contracts.fixtures[0],sha256:'0'.repeat(64)}),/changed/);
});
test('Lifecycle negative acceptance rejects extra failures, partial checks and skips',()=>{
  const fixture=contracts.fixtures.find(f=>f.id==='lifecycle'),foreign='http://127.0.0.1:2/probe.svg';
  const result={status:'failed',checks:fixture.assertions.expectedChecks.map(label=>({label,passed:label!=='rmt build local http assets only',details:foreign})),errors:['rmt build local http assets only']};
  negativeLifecycle(result,fixture,foreign);
  for(const transform of [r=>r.checks.pop(),r=>r.checks[0].passed=false,r=>r.checks[0].skipped=true,r=>r.errors.push('other')]){
    const copy=structuredClone(result);transform(copy);assert.throws(()=>negativeLifecycle(copy,fixture,foreign));
  }
});
