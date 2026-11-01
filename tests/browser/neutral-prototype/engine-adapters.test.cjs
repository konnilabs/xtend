'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createEngineAdapter} = require('./engine-adapters.cjs');
const {exercise} = require('./qualification.cjs');
const fixtures = require('./fixture-contracts.json').fixtures;

// Protocol models only. No driver or browser is spawned by this file.
function model(engine, options = {}) {
  let current='primary', sequence=0, closed=false, foreign=false;
  const contexts=new Set(['primary']), scripts=new Map(), calls=[];
  const owner={assertCurrent(){if(options.ownerLost)throw Error('ownership lost');}};
  const rawFixture=f=>({status:'passed',checks:f.assertions.expectedChecks.map(id=>({[f.assertions.idField]:id,[f.assertions.verdictField]:true})),errors:[]});
  function evaluate(source) {
    if(source.includes('absent:!window.__hydrangea')) return {absent:![...scripts.values()].some(s=>s.context===current),page:true};
    if(source.includes('typeof window.__neutralPreload'))return 'undefined';
    if(source.includes('__bidiFixture'))return scripts.size ? {status:'passed',early:true,active:0,maxActive:1,requests:[1,2,3].map(()=>({started:1,finished:2,bytes:1,sourceHash:'synthetic'})),errors:[]} : {status:'absent'};
    if(source.includes('__xtendWp1DeliberatelyWrongResultKey'))return null;
    for(const f of fixtures)if(source.includes(f.resultKey)){
      const value=rawFixture(f);
      if(options.productFailure && f.id==='core'){value.status='failed';value.checks[0][f.assertions.verdictField]=false;}
      if(foreign && f.id==='lifecycle') {value.status='failed';value.checks.at(-1).passed=false;value.checks.at(-1).details='http://127.0.0.1:9998/probe.svg';value.errors=['rmt build local http assets only'];}
      return value;
    }
    return {};
  }
  function add(source,context){const id=options.duplicateScript?'one':'script-'+(++sequence);scripts.set(id,{source,context});foreign=source.includes('probe.svg');return id;}
  async function command(method,route,body) {
    calls.push({method,route,body});if(options.commandError)throw Error('transport failure');
    if(route.endsWith('/window/new')){contexts.add('secondary');return {handle:'secondary'};}
    if(route.endsWith('/window')){
      if(method==='GET')return current;
      if(method==='POST'){assert(contexts.has(body.handle));current=body.handle;return null;}
      contexts.delete(current);return [...contexts];
    }
    if(route.endsWith('/goog/cdp/execute')){
      if(body.cmd==='Page.addScriptToEvaluateOnNewDocument')return {identifier:add(body.params.source,current)};
      assert.equal(body.cmd,'Page.removeScriptToEvaluateOnNewDocument');
      if(options.removeError)throw Error('preload cleanup failed');
      scripts.delete(body.params.identifier);foreign=false;return {};
    }
    if(route.endsWith('/execute/sync'))return evaluate(body.script);
    if(route.endsWith('/url'))return null;
    throw Error('Unexpected model command');
  }
  const bidi={async command(method,params){
    calls.push({method,params});
    if(method==='browsingContext.getTree')return {contexts:options.missingPrimary?[]:[{context:'primary'}]};
    if(method==='script.addPreloadScript')return {script:add(params.functionDeclaration,params.contexts[0])};
    if(method==='script.removePreloadScript'){if(options.removeError)throw Error('preload cleanup failed');scripts.delete(params.script);foreign=false;return {};}
    if(method==='browsingContext.create'){contexts.add('secondary');return {context:'secondary'};}
    if(method==='browsingContext.navigate')return {};
    if(method==='script.evaluate'){const before=current;current=params.target.context;const value=evaluate(params.expression);current=before;return {type:'success',result:{type:'string',value:JSON.stringify(value)}};}
    if(method==='browsingContext.close'){contexts.delete(params.context);return {};}
    throw Error('Unexpected model BiDi command');
  },async close(){closed=true;if(options.closeError)throw Error('BiDi cleanup failed');return {status:'passed',closed:true};}};
  const input={engine,command,identity:{browserName:engine==='firefox'?'firefox':'chrome',webSocketUrl:'ws://127.0.0.1:1/session/model'},sessionId:'model',owner,connectBiDi:async()=>bidi};
  return {input,calls,scripts,contexts,wasClosed:()=>closed};
}
for(const engine of ['chromium','firefox']) {
  test(`${engine} transport model: scoped preload, secondary context isolation and removal`,async()=>{
    const m=model(engine),a=await createEngineAdapter(m.input);
    const id=await a.addPreload(a.primary,'window.marker=true;');
    const secondary=await a.createContext();await a.navigateContext(secondary,'http://127.0.0.1:9999/fixture');
    assert.deepEqual(await a.evaluateContext(secondary,'({absent:!window.__hydrangea,page:window.__pageSeen})'),{absent:true,page:true});
    await a.closeContext(secondary);await a.removePreload(id);assert.equal((await a.close()).status,'passed');
    assert.equal(m.scripts.size,0);assert.equal(m.contexts.size,1);
    const cdp=m.calls.filter(c=>c.route?.endsWith('/goog/cdp/execute'));
    assert.equal(cdp.length,engine==='chromium'?2:0);
    assert.equal(m.calls.some(c=>c.method==='script.addPreloadScript'),engine==='firefox');
    await assert.rejects(a.createContext(),/closed/);
  });
  test(`${engine} adapter rejects unowned contexts and unknown preload identities`,async()=>{
    const a=await createEngineAdapter(model(engine).input);
    await assert.rejects(a.addPreload('foreign','x'),/Unknown owned/);
    await assert.rejects(a.removePreload('foreign'),/Unknown preload/);
    await assert.rejects(a.closeContext(a.primary),/Primary context/);await a.close();
  });
  test(`${engine} incomplete cleanup is not a pass`,async()=>{
    const a=await createEngineAdapter(model(engine).input);const id=await a.addPreload(a.primary,'x');
    await assert.rejects(a.close(),/Unremoved/);await a.removePreload(id);
    const secondary=await a.createContext();await assert.rejects(a.close(),/Unclosed/);await a.closeContext(secondary);await a.close();
  });
  test(`${engine} failed preload removal remains a cleanup error`,async()=>{
    const a=await createEngineAdapter(model(engine,{removeError:true}).input);const id=await a.addPreload(a.primary,'x');
    await assert.rejects(a.removePreload(id),/cleanup failed/);await assert.rejects(a.close(),/Unremoved/);
  });
  test(`${engine} uses identical production fixture assertions through the shared exercise (MODEL ONLY)`,async()=>{
    const m=model(engine), report={};let guards=0;
    await exercise('http://127.0.0.1:9999','http://127.0.0.1:9998',{engine,adapterFactory:args=>createEngineAdapter({...args,connectBiDi:m.input.connectBiDi})})({
      ...m.input,report,sandbox:{async verify(){guards++;return {status:'passed'};}},binary:'/model/browser'});
    assert.equal(report.qualification.status,'passed');assert.equal(guards,16);
    for(const f of fixtures)assert.deepEqual(report.qualification.cases[f.id].result.checks.map(c=>c[f.assertions.idField]),f.assertions.expectedChecks);
    assert.equal(report.qualification.transport.engine,engine);assert.equal(report.qualification.preloadCleanup.remaining,0);
    assert.equal(report.qualification.acceptedForRelease,false);
  });
  test(`${engine} sandbox guard failure prevents fixture continuation and still attempts cleanup`,async()=>{
    const m=model(engine), report={};
    await assert.rejects(exercise('http://127.0.0.1:9999','http://127.0.0.1:9998',{engine,adapterFactory:args=>createEngineAdapter({...args,connectBiDi:m.input.connectBiDi})})({
      ...m.input,report,sandbox:{async verify(){throw Error('Null seccomp sample');}},binary:'/model/browser'}));
    assert(Object.values(report.qualification.cases).every(c=>c.status==='not-run'));
    assert.equal(report.qualification.preloadCleanup.status,'passed');assert.equal(report.qualification.transportCleanup.status,'passed');
    assert.match(report.qualification.error,/Null seccomp/);
  });
  test(`${engine} shared exercise retains a product assertion failure with successful cleanup`,async()=>{
    const m=model(engine,{productFailure:true}),report={};
    await assert.rejects(exercise('http://127.0.0.1:9999','http://127.0.0.1:9998',{engine,adapterFactory:args=>createEngineAdapter({...args,connectBiDi:m.input.connectBiDi})})({
      ...m.input,report,sandbox:{async verify(){return {status:'passed'};}},binary:'/model/browser'}));
    assert.equal(report.qualification.cases.core.status,'failed');assert.equal(report.qualification.cases.a11y.status,'passed');
    assert.equal(report.qualification.sandboxObservationStatus,'passed');
    assert.equal(report.qualification.preloadCleanup.status,'passed');assert.equal(report.qualification.transportCleanup.status,'passed');
  });
}
test('BiDi initialization failure closes its connection and preserves cleanup failure',async()=>{
  const m=model('firefox',{missingPrimary:true,closeError:true});
  await assert.rejects(createEngineAdapter(m.input),error=>/Primary context/.test(error.message)&&/cleanup failed/.test(error.cleanup.message));assert(m.wasClosed());
});
test('No implicit engine selection, identity substitution or lost ownership',async()=>{
  for(const change of [{engine:'webkit'},{engine:undefined},{identity:{browserName:'foreign'}}])await assert.rejects(createEngineAdapter({...model('firefox').input,...change}));
  await assert.rejects(createEngineAdapter(model('chromium',{ownerLost:true}).input),/ownership lost/);
});
