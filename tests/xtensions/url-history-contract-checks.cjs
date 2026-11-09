'use strict';
const assert = require('node:assert/strict');
const ref = require('../../development/rmtx-a02/url-history/reference');
const templatePolicy = require('../../development/rmtx-a02/url-history/policy.v1.json');
const copy=value=>JSON.parse(JSON.stringify(value));
async function runURLHistoryContractChecks() {
  const { createRmtStateSelectorRuntime } = await import('../../xtendrmt/rmt-state-selector-runtime.js');
  const plan=require('../../development/rmtx-a02/inspect.cjs').inspectRepeated();
  const program=plan.orchestration.artifact, bindings=plan.xtensionBindings;
  const checked=[];
  const test=(name,fn)=>{fn();checked.push(name);};
  const create=(policy=copy(templatePolicy),extra={})=>ref.createURLStateContract(policy,{program,bindings,...extra});
  function fixture() {
    const initial=copy(program.state.states); initial[0].initial.items[0].filters[0].private='NEVER-IN-URL';
    const model=createRmtStateSelectorRuntime({states:[...initial,{id:'private',type:'object',initial:{secret:'PRIVATE-ROOT'}}]});
    const c=create(), lifetime={navigationId:()=>nav,isCurrent:()=>live,isViewCommitted:()=>view};
    let nav='n1',live=true,view=true;
    return {c,model,lifetime, nav(value){nav=value;},live(value){live=value;},view(value){view=value;}, reset(){
      const p=c.planRestore(null,model.modelReader.snapshot(),{navigationId:nav}); c.applyRestore(p,model,lifetime);return p;
    }};
  }
  const payload=(c,entries)=>({schema:'xtend.xtensions.url-state.v1',documentId:c.policy.documentId,policyId:c.policy.id,policyVersion:c.policy.version,entries});
  const entry=(keys,values={query:'deep'})=>({declarationId:'filter-panel',keys,values});
  const token=(c,entries)=>c.encode(payload(c,entries));
  test('explicit public policy, API and four wire schema versions',()=>{
    const c=create();assert.equal(c.apiVersion,'1.0.0');assert.equal(c.policy.exposure,'public-url');
    for(const file of ['policy','state','restore-plan','history-proposal']){const s=require(`../../development/rmtx-a02/url-history/${file}.v1.schema.json`);assert.equal(s.additionalProperties,false);assert(s.$id.endsWith('.v1'));}
  });
  test('caller policy mutation cannot alter validated grants',()=>{const p=copy(templatePolicy),c=create(p);p.fields[0].default='mutated';p.fields[0].id='wrong';assert.equal(c.policy.fields[0].default,'');const f=fixture();assert.equal(c.capture(f.model.snapshot()).entries.length,3);});
  for(const [label,mutate] of [
    ['public exposure',p=>{p.exposure='private';}],['unknown field',p=>{p.extra=true;}],['wrong document',p=>{p.documentId='other';}],
    ['unknown surface',p=>{p.fields[0].surface='missing';}],['unknown prop',p=>{p.fields[0].prop='missing';}],['duplicate id',p=>{p.fields[1].id=p.fields[0].id;}],
    ['duplicate source',p=>{p.fields[1].prop=p.fields[0].prop;}],['wrong default type',p=>{p.fields[0].default=7;}],['invalid null default',p=>{p.fields[0].default=null;}],
    ['unknown grant member',p=>{p.fields[0].writeState='private';}],['empty fields',p=>{p.fields=[];}],['token budget',p=>{p.limits.tokenBytes=9000;}],
    ['instance budget',p=>{p.limits.instances=0;}],['relational budget',p=>{p.limits.instances=1;}],['policy version',p=>{p.version=0;}],
    ['unsafe id',p=>{p.fields[0].id='constructor';}],['object default',p=>{p.fields[0].default={};}]
  ])test(`policy rejects ${label}`,()=>{const p=copy(templatePolicy);mutate(p);assert.throws(()=>create(p));});
  test('policies and Model snapshots reject getters without invoking them',()=>{
    let calls=0;const p=copy(templatePolicy);Object.defineProperty(p,'fields',{enumerable:true,get(){calls++;return [];}});assert.throws(()=>create(p));
    const c=create(),snapshot={};Object.defineProperty(snapshot,'states',{get(){calls++;return {};}});assert.throws(()=>c.capture(snapshot));assert.equal(calls,0);
  });
  test('canonical capture is independent of Model order and preserves typed ancestor keys',()=>{
    const f=fixture(),a=f.c.capture(f.model.snapshot()),states=copy(f.model.snapshot().states);states.groups.items.reverse();states.groups.items[1].filters.reverse();
    assert.equal(f.c.encode(a),f.c.encode(f.c.capture({states})));assert.deepEqual(a.entries.map(e=>e.keys),[['a','1'],['a',1],['b',1]]);
  });
  test('private Model fields, incarnations and DOM host ids never enter URL or plan data',()=>{
    const f=fixture(),p=f.c.capture(f.model.snapshot()),wire=ref.canonical(p);assert(!wire.includes('NEVER-IN-URL'));assert(!wire.includes('PRIVATE-ROOT'));assert(!wire.includes('incarnation'));assert(!wire.includes('hostSurface'));
    const prepared=f.c.planRestore(null,f.model.snapshot(),{navigationId:'n1'});assert(!ref.canonical(prepared).includes('NEVER-IN-URL'));
  });
  test('UTF-8 scalar values, nullable fields and typed keys roundtrip',()=>{const c=create(),p=payload(c,[entry(['a',1],{query:'東京 🌻 & # ? =',activeId:'é'}),entry(['a','1'],{query:'string-key'})]);assert.deepEqual(c.decode(c.encode(p)),{...p,entries:[p.entries[1],p.entries[0]]});});
  test('default fields and entries are omitted from canonical payloads',()=>{const c=create();const t=token(c,[entry(['a',1],{query:'',activeId:null})]);assert.deepEqual(c.decode(t).entries,[]);});
  for(const [label,mutate] of [
    ['schema version',p=>{p.schema += '.unsupported';}],['document',p=>{p.documentId='other';}],['policy id',p=>{p.policyId='other';}],
    ['policy version',p=>{p.policyVersion=2;}],['wire extra',p=>{p.incarnation=3;}],['entry extra',p=>{p.entries[0].hostSurface='forged';}],
    ['unknown declaration',p=>{p.entries[0].declarationId='unknown';}],['wrong key arity',p=>{p.entries[0].keys=['a'];}],
    ['object key',p=>{p.entries[0].keys[1]={};}],['negative zero key',p=>{p.entries[0].keys[1]=-0;}],['negative key',p=>{p.entries[0].keys[1]=-1;}],
    ['unknown public field',p=>{p.entries[0].values.private='secret';}],['scalar type',p=>{p.entries[0].values.query=7;}],['nested value',p=>{p.entries[0].values.query={};}],
    ['duplicate address',p=>{p.entries.push(copy(p.entries[0]));}],['empty values',p=>{p.entries[0].values={};}],['entry budget',p=>{p.entries=Array.from({length:33},(_,i)=>entry(['a',i]));}],
    ['value budget',p=>{p.entries[0].values.query='x'.repeat(513);}]
  ])test(`encoder rejects ${label}`,()=>{const c=create(),p=payload(c,[entry(['a',1])]);mutate(p);assert.throws(()=>c.encode(p));});
  const rawToken=text=>'1.'+Buffer.from(text).toString('base64url');
  test('decoder rejects noncanonical JSON, duplicate keys, default aliases and base64 padding',()=>{
    const c=create(),p=payload(c,[entry(['a',1])]),valid=c.encode(p);
    for(const t of [valid+'=',valid+'!',valid.replace(/^1\./,'2.'),'1.a','',rawToken(JSON.stringify(p)),rawToken(ref.canonical(p)+' '),rawToken(ref.canonical(p).replace('"schema":','"schema":"wrong","schema":')),rawToken(ref.canonical(payload(c,[entry(['a',1],{query:''})]))),valid.slice(0,-1)+(valid.endsWith('A')?'B':'A')])assert.throws(()=>c.decode(t));
  });
  test('decoder rejects invalid UTF-8 and oversized input before parsing',()=>{const c=create();assert.throws(()=>c.decode('1.'+Buffer.from([0xff]).toString('base64url')));assert.throws(()=>c.decode('1.'+'A'.repeat(4096)));});
  test('token budget failure is explicit and never truncates values',()=>{const p=copy(templatePolicy);p.limits.tokenBytes=100;const c=create(p);assert.throws(()=>token(c,[entry(['a',1])]),/budget/);});
  test('capture applies public instance budget independently of wire entry count',()=>{const p=copy(templatePolicy);p.limits.instances=2;p.limits.entries=2;const c=create(p),f=fixture();assert.throws(()=>c.capture(f.model.snapshot()),/instance budget/);});
  test('one atomic restore updates only granted Model fields and preserves private data',()=>{
    const f=fixture();f.reset();let events=0;const stop=f.model.modelReader.subscribe(()=>events++);
    const p=f.c.planRestore(token(f.c,[entry(['a',1],{query:'restored',activeId:'42'}),entry(['a','1'],{query:'other'})]),f.model.snapshot(),{navigationId:'n1'});
    assert.equal(p.status,'ready');assert.equal(f.c.applyRestore(p,f.model,f.lifetime),true);assert.equal(events,1);stop();
    const g=f.model.getState('groups');assert.equal(g.items[0].filters[0].query,'restored');assert.equal(g.items[0].filters[0].selection.activeId,'42');assert.equal(g.items[0].filters[1].query,'other');assert.equal(g.items[1].filters[0].query,'');assert.equal(g.items[0].filters[0].private,'NEVER-IN-URL');assert.equal(f.model.getState('private').secret,'PRIVATE-ROOT');
  });
  test('URL absence restores versioned public defaults and omits no private fields',()=>{const f=fixture();assert.equal(f.reset().changes.length,3);assert.equal(f.c.capture(f.model.snapshot()).entries.length,0);assert.equal(f.reset().status,'unchanged');});
  test('omitted known addresses and fields restore defaults rather than leaking previous navigation state',()=>{
    const f=fixture();f.reset();let p=f.c.planRestore(token(f.c,[entry(['a',1],{query:'first',activeId:'42'})]),f.model.snapshot(),{navigationId:'n1'});f.c.applyRestore(p,f.model,f.lifetime);
    p=f.c.planRestore(token(f.c,[entry(['a','1'],{query:'second'})]),f.model.snapshot(),{navigationId:'n1'});f.c.applyRestore(p,f.model,f.lifetime);
    assert.equal(f.model.getState('groups').items[0].filters[0].query,'');assert.equal(f.model.getState('groups').items[0].filters[0].selection.activeId,null);
  });
  test('unmounted logical instances can be restored without creating hosts',()=>{
    const f=fixture(),groups=copy(f.model.getState('groups'));groups.items[0].filters[0].enabled=false;f.model.setState('groups',groups);
    const p=f.c.planRestore(token(f.c,[entry(['a',1])]),f.model.snapshot(),{navigationId:'n1'});assert.equal(p.status,'ready');f.c.applyRestore(p,f.model,f.lifetime);
    assert.equal(f.model.getState('groups').items[0].filters[0].query,'deep');assert.equal(f.model.getState('groups').items[0].filters[0].enabled,false);
  });
  test('unknown keys defer the entire restore and cannot create Model items',()=>{
    const f=fixture(),before=ref.canonical(f.model.snapshot().states);const p=f.c.planRestore(token(f.c,[entry(['a',1]),entry(['a','future'])]),f.model.snapshot(),{navigationId:'n1'});
    assert.equal(p.status,'deferred');assert.deepEqual(p.changes,[]);assert.equal(p.missing.length,1);assert.throws(()=>f.c.applyRestore(p,f.model,f.lifetime));assert.equal(ref.canonical(f.model.snapshot().states),before);
    assert.throws(()=>f.c.proposeHistory(f.model.snapshot(),{cause:'commit',currentToken:null,navigationId:'n1'}),/not settled/);
  });
  test('a fresh plan after data arrival resolves stable keys even after reorder',()=>{
    const f=fixture(),t=token(f.c,[entry(['a','future'])]);const old=f.c.planRestore(t,f.model.snapshot(),{navigationId:'n1'});
    const groups=copy(f.model.getState('groups'));groups.items.reverse();groups.items[1].filters.push({id:'future',query:'',selection:{activeId:null},enabled:true});groups.items[1].filters.reverse();f.model.setState('groups',groups);
    const p=f.c.planRestore(t,f.model.snapshot(),{navigationId:'n1'});assert.equal(p.status,'ready');assert.throws(()=>f.c.applyRestore(old,f.model,f.lifetime));f.c.applyRestore(p,f.model,f.lifetime);
    assert.equal(f.model.getState('groups').items[1].filters[0].query,'deep');
  });
  test('stale navigation, abort and user interaction invalidate write authority',()=>{
    for(const invalidate of [f=>f.nav('n2'),f=>f.live(false),f=>{const a=new AbortController();a.abort();f.lifetime.signal=a.signal;}]){
      const f=fixture(),before=ref.canonical(f.model.snapshot().states),p=f.c.planRestore(null,f.model.snapshot(),{navigationId:'n1'});invalidate(f);assert.throws(()=>f.c.applyRestore(p,f.model,f.lifetime));assert.equal(ref.canonical(f.model.snapshot().states),before);
    }
  });
  test('Model changes invalidate full-root plans instead of overwriting unrelated commits',()=>{
    const f=fixture(),p=f.c.planRestore(null,f.model.snapshot(),{navigationId:'n1'});f.model.setState('private',{secret:'new'});assert.throws(()=>f.c.applyRestore(p,f.model,f.lifetime),/Model changed/);assert.equal(f.model.getState('private').secret,'new');
  });
  test('plans are one-shot, immutable and cannot acquire authority through JSON serialization',()=>{
    const f=fixture(),p=f.c.planRestore(null,f.model.snapshot(),{navigationId:'n1'});assert(Object.isFrozen(p));assert.throws(()=>f.c.applyRestore(copy(p),f.model,f.lifetime));f.c.applyRestore(p,f.model,f.lifetime);assert.throws(()=>f.c.applyRestore(p,f.model,f.lifetime));
  });
  test('invalid URL data changes no Model values and blocks History publication',()=>{
    const f=fixture();f.reset();const before=ref.canonical(f.model.snapshot().states);assert.throws(()=>f.c.planRestore('2.bad',f.model.snapshot(),{navigationId:'n1'}));assert.equal(ref.canonical(f.model.snapshot().states),before);assert.throws(()=>f.c.proposeHistory(f.model.snapshot(),{cause:'commit',currentToken:null,navigationId:'n1'}));
  });
  test('identity key sources cannot be granted writable URL fields',()=>{
    const b=copy(bindings);b.bindings[0].binding.props.id={state:'groups',path:['items',{repeat:0},'filters',{repeat:1},'id'],type:'number'};
    // Use only numeric keys in this policy fixture so source typing is valid.
    const pr=copy(program);pr.state.states[0].initial.items[0].filters.splice(1,1);
    const p=copy(templatePolicy);p.fields=[{id:'id',surface:'filter',prop:'id',default:1}];const c=create(p,{program:pr,bindings:b});
    assert.throws(()=>c.capture({states:{groups:pr.state.states[0].initial}}),/instance keys/);
  });
  test('two public grants cannot alias or overlap the same Model target',()=>{
    const b=copy(bindings);b.bindings[0].binding.props.alias=copy(b.bindings[0].binding.props.query);
    const p=copy(templatePolicy);p.fields.push({id:'alias',surface:'filter',prop:'alias',default:''});const c=create(p,{bindings:b});const f=fixture();assert.throws(()=>c.capture(f.model.snapshot()),/overlap/);
  });
  test('History defaults to replace, explicit checkpoints push and no-op snapshots do not write',()=>{
    const f=fixture();f.reset();const groups=copy(f.model.getState('groups'));groups.items[0].filters[0].query='user';f.model.setState('groups',groups);
    const opts={navigationId:'n1',currentToken:null};assert.equal(f.c.proposeHistory(f.model.snapshot(),{...opts,cause:'commit'}).mode,'replace');assert.equal(f.c.proposeHistory(f.model.snapshot(),{...opts,cause:'checkpoint'}).mode,'push');
    const sameToken=f.c.encode(f.c.capture(f.model.snapshot()));assert.equal(f.c.proposeHistory(f.model.snapshot(),{...opts,currentToken:sameToken,cause:'commit'}).mode,'none');
    assert.equal(f.c.proposeHistory(f.model.snapshot(),{...opts,cause:'traverse'}).mode,'none');
  });
  test('History refuses pending View commits, stale snapshots, copied proposals and repeated publication',()=>{
    const f=fixture();f.reset();let p=f.c.proposeHistory(f.model.snapshot(),{navigationId:'n1',currentToken:null,cause:'commit'});f.view(false);assert.throws(()=>f.c.checkHistory(p,f.model.snapshot(),f.lifetime));f.view(true);assert.equal(f.c.checkHistory(p,f.model.snapshot(),f.lifetime),false);assert.throws(()=>f.c.checkHistory(p,f.model.snapshot(),f.lifetime));
    p=f.c.proposeHistory(f.model.snapshot(),{navigationId:'n1',currentToken:null,cause:'commit'});assert.throws(()=>f.c.checkHistory(copy(p),f.model.snapshot(),f.lifetime));const groups=copy(f.model.getState('groups'));groups.items[0].filters[0].query='later';f.model.setState('groups',groups);assert.throws(()=>f.c.checkHistory(p,f.model.snapshot(),f.lifetime),/Model state changed/);
  });
  test('new restore generations supersede proposals even if a host mistakenly reuses the id',()=>{
    const f=fixture();f.reset();const p=f.c.proposeHistory(f.model.snapshot(),{navigationId:'n1',currentToken:null,cause:'commit'});f.reset();assert.throws(()=>f.c.checkHistory(p,f.model.snapshot(),f.lifetime),/superseded/);
  });
  test('a newer History proposal revokes older publication authority for the same Model state',()=>{
    const f=fixture();f.reset();const opts={navigationId:'n1',currentToken:null,cause:'initialize'};
    const old=f.c.proposeHistory(f.model.snapshot(),opts),latest=f.c.proposeHistory(f.model.snapshot(),opts);
    assert.throws(()=>f.c.checkHistory(old,f.model.snapshot(),f.lifetime),/superseded/);
    assert.equal(f.c.checkHistory(latest,f.model.snapshot(),f.lifetime),false);
  });
  test('query operations preserve unrelated raw query bytes and never handle route paths or hash fragments',()=>{
    const c=create(),t=token(c,[entry(['a',1])]),q='locale=de&x=a%20b&x=a+b&&empty=';
    assert.equal(ref.withToken(q,t),q+'&xtend-state='+t);assert.equal(ref.readQuery(ref.withToken(q,t)),t);assert.equal(ref.withToken(ref.withToken(q,t),null),q);assert.equal(ref.readQuery(q),null);assert.equal(ref.readQuery('xtend-state='),'');
    for(const query of ['xtend-state=a&xtend-state=b','%78tend-state=a&xtend-state=b','xtend-state=%ZZ','?xtend-state=x'])assert.throws(()=>ref.readQuery(query));
  });
  test('zero-delta encoded snapshots normalize to parameter absence without adding History entries',()=>{const f=fixture();f.reset();const empty=f.c.encode(f.c.capture(f.model.snapshot()));const p=f.c.proposeHistory(f.model.snapshot(),{navigationId:'n1',currentToken:empty,cause:'initialize'});assert.equal(p.mode,'replace');assert.equal(p.token,null);});
  test('dispose revokes pending plans and proposals without Model or History writes',()=>{
    const f=fixture();const pending=f.c.planRestore(null,f.model.snapshot(),{navigationId:'n1'}),before=ref.canonical(f.model.snapshot().states);f.c.dispose();
    assert.throws(()=>f.c.applyRestore(pending,f.model,f.lifetime));assert.throws(()=>f.c.planRestore(null,f.model.snapshot(),{navigationId:'n1'}));assert.equal(ref.canonical(f.model.snapshot().states),before);
  });
  test('asynchronous lifetime predicates cannot assert synchronous commit authority',()=>{
    const f=fixture(),p=f.c.planRestore(null,f.model.snapshot(),{navigationId:'n1'});assert.throws(()=>f.c.applyRestore(p,f.model,{...f.lifetime,isCurrent:()=>Promise.resolve(true)}));
  });
  test('v1 rejects opaque json and compound controlled props as public grants',()=>{
    const b=copy(bindings);b.bindings[0].binding.props.query.type='json';assert.throws(()=>create(copy(templatePolicy),{bindings:b}),/scalar controlled prop/);
  });
  test('selected address domains must stay unambiguous even before collections load',()=>{
    const b=copy(bindings),pr=copy(program);pr.state.states[0].initial.items=[];
    pr.state.states.push({id:'global',type:'string',initial:'',preserve:''});
    pr.surfaces.push({...pr.surfaces[0],id:'static'});
    const host=copy(pr.render.root.children[0]);host.surface='static';host.key='static';pr.render.root.children.push(host);
    b.bindings.push({surface:'static',binding:{schema:'xtend.xtensions.state-binding.v2',address:{documentId:b.documentId,declarationId:'filter-panel',keys:['x',0]},props:{query:{state:'global',path:[],type:'string'}},intents:{}}});
    const p=copy(templatePolicy);p.fields.push({id:'static-query',surface:'static',prop:'query',default:''});assert.throws(()=>create(p,{program:pr,bindings:b}),/address domains/);
  });
  test('two static Model roots restore through one real transaction',()=>{
    const p=require('../../development/rmtx-a02/inspect.cjs').inspect(),pr=p.orchestration.artifact;
    const c=ref.createURLStateContract({...copy(templatePolicy),id:'static-views',documentId:'filter-example',fields:[
      {id:'left-query',surface:'filter.left',prop:'query',default:''},{id:'right-query',surface:'filter.right',prop:'query',default:''}]},{program:pr,bindings:p.xtensionBindings});
    const model=createRmtStateSelectorRuntime({states:pr.state.states});let changes=0;const stop=model.modelReader.subscribe(()=>changes++);
    const t=c.encode({schema:'xtend.xtensions.url-state.v1',documentId:'filter-example',policyId:'static-views',policyVersion:1,entries:[
      {declarationId:'filter-panel',keys:['left'],values:{'left-query':'L'}},{declarationId:'filter-panel',keys:['right'],values:{'right-query':'R'}}]});
    const prepared=c.planRestore(t,model.snapshot(),{navigationId:'n1'});c.applyRestore(prepared,model,{navigationId:()=> 'n1',isCurrent:()=>true});stop();
    assert.equal(changes,1);assert.equal(model.getState('filter.left').query,'L');assert.equal(model.getState('filter.right').query,'R');
  });
  test('only explicit reset clears malformed or duplicate state parameters after defaults commit',()=>{
    const f=fixture();f.reset();const proposal=f.c.proposeHistory(f.model.snapshot(),{navigationId:'n1',currentToken:'2.unsupported',cause:'reset'});
    assert.equal(proposal.mode,'replace');assert.equal(proposal.token,null);assert.equal(f.c.checkHistory(proposal,f.model.snapshot(),f.lifetime),true);
    assert.equal(ref.withToken('locale=de&xtend-state=%ZZ&%78tend-state=bad&x=a+b',null),'locale=de&x=a+b');
    const groups=copy(f.model.getState('groups'));groups.items[0].filters[0].query='not-default';f.model.setState('groups',groups);
    assert.throws(()=>f.c.proposeHistory(f.model.snapshot(),{navigationId:'n1',currentToken:'bad',cause:'reset'}),/defaults/);
  });
  const f=fixture();f.reset();const example=payload(f.c,[entry(['a',1],{query:'東京 🌻',activeId:'selected'})]);const exampleToken=f.c.encode(example);
  const restore=f.c.planRestore(exampleToken,f.model.snapshot(),{navigationId:'n1'});f.c.applyRestore(restore,f.model,f.lifetime);
  const history=f.c.proposeHistory(f.model.snapshot(),{navigationId:'n1',currentToken:null,cause:'checkpoint'});
  return {ok:true,checks:checked.length,names:checked,samples:{policy:f.c.policy,state:f.c.decode(exampleToken),restore,history},token:exampleToken};
}
module.exports={runURLHistoryContractChecks};
