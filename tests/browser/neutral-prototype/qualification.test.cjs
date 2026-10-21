'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {endpoint,connect}=require('./bidi.cjs');
const {parseStat,parseStatus,processRole,threadObservationLimits,createProcReader,Continuity,validateContent}=require('./linux-observer.cjs');
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

// Kernel model only: these regressions exercise real reader logic, not a browser.
function procFixture(change=()=>{},readerOptions={}){
  const row={...leader,pid:21,start:'101'},tasks=new Map([[21,{...row}],[22,{...row,pid:22,start:'102'}]]);
  const state={row,tasks,events:[]};
  const missing=()=>{throw Object.assign(Error('fixture absent'),{code:'ENOENT'});};
  const stat=r=>{if(!r)missing();const fields=Array(20).fill('0');Object.assign(fields,{0:r.state,1:String(r.parent),2:String(r.group),3:String(r.session),19:r.start});return r.pid+' (fixture) '+fields.join(' ');};
  const status='Uid: 501 501 501 501\nNoNewPrivs: 1\nSeccomp: 2\nSeccomp_filters: 2\nCapEff: 0000';
  const io={
    readFileSync(file){change(state,file,'read');const match=file.match(/^\/proc\/21(?:\/task\/(\d+))?\/(stat|status|cmdline)$/);assert(match,file);
      const r=match[1]?tasks.get(Number(match[1])):state.row;if(!state.row||!r)missing();
      if(match[2]==='stat')return stat(r);if(match[2]==='status')return r.status??status;
      return '/browser/firefox\0-contentproc\0tab\0';},
    readlinkSync(file){change(state,file,'link');if(!state.row)missing();return file.endsWith('/exe')?'/browser/firefox':'namespace:[1]';},
    readdirSync(file){change(state,file,'list');assert.equal(file,'/proc/21/task');if(!state.row)missing();return [...tasks.keys()].map(String);}
  };
  return {...state,state,reader:createProcReader({io,events:state.events,...readerOptions}),expected:{...row}};
}
test('Proc reader authenticates all surviving content threads with start identities',()=>{
  const f=procFixture(),value=f.reader.read(f.expected);
  assert.equal(value.threads.length,2);assert.equal(value.threads[1].identity.start,'102');
  assert.equal(validateContent([value],browser,501,['/browser/firefox']).length,1);assert.equal(f.events.length,0);
});
for(const state of ['absent','Z'])test('Proc reader records confirmed process departure: '+state,()=>{
  const f=procFixture((s,file)=>{if(file==='/proc/21/exe'){if(state==='absent')s.row=null;else s.row.state='Z';throw Object.assign(Error('gone'),{code:'ENOENT'});}});
  assert.equal(f.reader.read(f.expected),null);assert.equal(f.events[0].outcome,'process-ended');
  assert.equal(f.events[0].process.start,'101');assert.equal(f.events[0].stage,'process-executable');
  assert(Number.isFinite(f.events[0].monotonicMs));assert(!Number.isNaN(Date.parse(f.events[0].observedAt)));
  assert.throws(()=>validateContent([],browser,501,['/browser/firefox']),/No authenticated/);
});
test('Confirmed task departure retains evidence for every surviving task, never a pass for the departed task',()=>{
  const f=procFixture((s,file)=>{if(file==='/proc/21/task/22/status')s.tasks.delete(22);});
  const value=f.reader.read(f.expected);assert.equal(value.threads.length,1);assert.equal(value.threads[0].tid,21);
  assert.equal(f.events[0].outcome,'thread-ended');assert.equal(f.events[0].thread.start,'102');assert.equal(f.events[0].stage,'thread-status');
});
for(const kind of ['missing-live-security','permission','process-reuse','thread-reuse','no-initial-thread-identity'])test('Proc reader fails closed: '+kind,()=>{
  let lists=0;
  const f=procFixture((s,file,op)=>{
    if(kind==='missing-live-security'&&file==='/proc/21/task/22/status')throw Object.assign(Error('gone'),{code:'ENOENT'});
    if(kind==='permission'&&file==='/proc/21/task/22/status')throw Object.assign(Error('denied'),{code:'EACCES'});
    if(kind==='process-reuse'&&file==='/proc/21/exe'){s.row.start='999';throw Object.assign(Error('gone'),{code:'ENOENT'});}
    if(kind==='thread-reuse'&&file==='/proc/21/task/22/status'){s.tasks.get(22).start='999';throw Object.assign(Error('gone'),{code:'ENOENT'});}
    if(kind==='no-initial-thread-identity'&&file==='/proc/21/task/22/stat')s.tasks.delete(22);
  });
  assert.throws(()=>f.reader.read(f.expected),/unavailable|identity changed|Unmeasured/);
  assert.equal(f.events.length,1);assert.notEqual(f.events[0].outcome,'thread-ended');
  assert(!/argv|environ|command|private-value/.test(JSON.stringify(f.events)));
});

test('Known terminal task remains an explicit departure, never a live security witness',()=>{
  const f=procFixture((s,file)=>{if(file==='/proc/21/task/22/status'){s.tasks.get(22).state='Z';throw Object.assign(Error('gone'),{code:'ENOENT'});}});
  const value=f.reader.read(f.expected);assert.equal(value.threads.length,1);
  assert(f.events.every(event=>event.outcome==='thread-ended'&&event.thread.start==='102'));
});
test('Missing live process executable is blocked instead of being mistaken for exit',()=>{
  const f=procFixture((_s,file)=>{if(file==='/proc/21/exe')throw Object.assign(Error('gone'),{code:'ENOENT'});});
  assert.throws(()=>f.reader.read(f.expected),/pid=21 stage=process-executable/);
  assert.equal(f.events[0].outcome,'security-evidence-unavailable');
});

for(const arrivalRounds of [1,3])test('Bounded acquisition fully measures new tasks then observes a complete set: '+arrivalRounds,()=>{
  let lists=0;const reads=new Map();
  const f=procFixture((s,file,op)=>{
    if(op==='list'&&++lists>=2&&lists<=arrivalRounds+1){const tid=21+lists;s.tasks.set(tid,{...s.row,pid:tid,start:String(101+lists)});}
    const match=file.match(/task\/(\d+)\/status$/);if(match)reads.set(Number(match[1]),(reads.get(Number(match[1]))||0)+1);
  });
  const value=f.reader.read(f.expected);assert.equal(value.threads.length,2+arrivalRounds);
  assert.equal(value.threadObservation.rounds,1+arrivalRounds);assert.equal(value.threadObservation.liveAtEnd,value.threads.length);
  assert.equal(value.threadObservation.measured,value.threads.length);assert.deepEqual(value.threadObservation.limits,threadObservationLimits);
  assert([...reads.values()].every(count=>count===1));assert.equal(validateContent([value],browser,501,['/browser/firefox']).length,1);
});
test('New authenticated task departure before its security read is recorded without fabricating a pass',()=>{
  let lists=0;const f=procFixture((s,file,op)=>{
    if(op==='list'&&++lists===2)s.tasks.set(23,{...s.row,pid:23,start:'103'});
    if(file==='/proc/21/task/23/status')s.tasks.delete(23);
  });
  const value=f.reader.read(f.expected);assert.equal(value.threads.length,2);assert.equal(value.threadObservation.departed,1);
  assert.equal(value.threadObservation.rounds,2);assert(f.events.some(e=>e.outcome==='thread-ended'&&e.thread.start==='103'));
});
for(const change of ['reuse','process-reuse','missing-field','unreadable','unsafe-filter','wrong-user','wrong-group'])test('New task never bypasses identity or security requirements: '+change,()=>{
  let lists=0,taskReads=0;const f=procFixture((s,file,op)=>{
    if(op==='list'&&++lists===2)s.tasks.set(23,{...s.row,pid:23,start:'103'});
    if(lists===2&&file==='/proc/21/task/23/stat'&&++taskReads===2){
      if(change==='reuse')s.tasks.get(23).start='999';
      if(change==='wrong-group')s.tasks.get(23).group=99;
    }
    if(file==='/proc/21/task/23/status'){
      if(change==='process-reuse')s.row.start='999';
      if(change==='unreadable')throw Object.assign(Error('fixture denied'),{code:'EACCES'});
      if(change==='missing-field')s.tasks.get(23).status='Uid: 501 501 501 501\nNoNewPrivs: 1\nSeccomp: 2\nCapEff: 0000';
      if(change==='unsafe-filter')s.tasks.get(23).status='Uid: 501 501 501 501\nNoNewPrivs: 1\nSeccomp: 2\nSeccomp_filters: 1\nCapEff: 0000';
      if(change==='wrong-user')s.tasks.get(23).status='Uid: 0 0 0 0\nNoNewPrivs: 1\nSeccomp: 2\nSeccomp_filters: 2\nCapEff: 0000';
    }
  });
  assert.throws(()=>validateContent([f.reader.read(f.expected)],browser,501,['/browser/firefox']),/identity|ownership|field|unavailable|seccomp|privilege/i);
});
test('Persistent task arrivals exhaust the fixed round budget without retrying security reads',()=>{
  let lists=0;const f=procFixture((s,_file,op)=>{if(op==='list'&&++lists>=2){const tid=21+lists;s.tasks.set(tid,{...s.row,pid:tid,start:String(101+lists)});}});
  assert.throws(()=>f.reader.read(f.expected),/round limit exceeded/);assert.equal(lists,threadObservationLimits.rounds+1);
  assert.equal(f.events.at(-1).outcome,'round limit exceeded');
});
test('Thread acquisition enforces the clock deadline even if a complete set would otherwise result',()=>{
  let clock=0;const f=procFixture((_s,file)=>{if(file==='/proc/21/task/22/status')clock=threadObservationLimits.milliseconds;},{now:()=>clock});
  assert.throws(()=>f.reader.read(f.expected),/time limit exceeded/);assert.equal(f.events.at(-1).outcome,'time limit exceeded');
});
test('Thread acquisition bounds cumulative identities even when departing tasks keep the current set small',()=>{
  let lists=0;const f=procFixture((s,_file,op)=>{
    if(op==='list'&&++lists>=2){for(const tid of [...s.tasks.keys()])if(tid>22)s.tasks.delete(tid);
      for(let i=0;i<100;i++){const tid=1000*lists+i;s.tasks.set(tid,{...s.row,pid:tid,start:String(tid)});}}
  });
  assert.throws(()=>f.reader.read(f.expected),/identity limit exceeded/);assert.equal(f.events.at(-1).outcome,'identity limit exceeded');
});

test('Known newcomer disappearing before its measurement is explicitly confirmed absent',()=>{
  let lists=0,reads=0;const f=procFixture((s,file,op)=>{
    if(op==='list'&&++lists===2)s.tasks.set(23,{...s.row,pid:23,start:'103'});
    if(file==='/proc/21/task/23/stat'&&++reads===2)s.tasks.delete(23);
  });
  const value=f.reader.read(f.expected);assert.equal(value.threads.length,2);assert.equal(value.threadObservation.liveAtEnd,2);
  assert.equal(value.threadObservation.departed,1);assert(f.events.some(e=>e.outcome==='thread-ended'&&e.thread.start==='103'));
});
test('A measured TID changing identity during follow-up cannot inherit its earlier security evidence',()=>{
  let lists=0;const f=procFixture((s,_file,op)=>{
    if(op==='list'&&++lists===2)s.tasks.set(23,{...s.row,pid:23,start:'103'});
    if(op==='list'&&lists===3)s.tasks.get(22).start='999';
  });
  assert.throws(()=>f.reader.read(f.expected),/Thread identity changed/);
});
test('Oversized current task sets are rejected before security sampling',()=>{
  const f=procFixture((s,_file,op)=>{if(op==='list')for(let i=100;i<100+threadObservationLimits.identities;i++)s.tasks.set(i,{...s.row,pid:i,start:String(i)});});
  assert.throws(()=>f.reader.read(f.expected),/identity limit exceeded/);
});
