'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{test}=require('node:test');
const {shape,accepted,aggregate}=require('./campaign.cjs');
const cases=['bidi-preload-order-fetch','bidi-context-isolation','bidi-removal','core','a11y','lifecycle','lifecycle-wrong-key','lifecycle-foreign-origin'];
function report(node){return {status:'passed',acceptedForRelease:false,node:'v'+node,platform:'linux',evidenceKind:'real-firefox-linux-qualification',linuxExecution:'observed',
  identity:{browserName:'firefox',browserVersion:'158.0.1'},sandbox:{platform:'linux'},
  cleanup:{complete:true,childReaped:true,groupGone:true,remaining:[]},
  phases:Object.fromEntries(['startup','sandbox','capabilities','product','qualification','sessionCleanup','groupCleanup'].map(n=>[n,{status:'passed'}])),
  qualification:{status:'passed',acceptedForRelease:false,cases:Object.fromEntries(cases.map(n=>[n,{status:'passed'}])),preloadCleanup:{status:'passed',remaining:0},transportCleanup:{status:'passed'}}};}
function matrix(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-qualification-aggregate-'));
  for(const node of ['24.18.0','26.5.0']){
    const dir=path.join(root,node);fs.mkdirSync(dir);fs.mkdirSync(path.join(dir,'cycle-1'));
    fs.writeFileSync(path.join(dir,'job-terminal.json'),JSON.stringify({node,replica:1,mode:'initial',outcomes:Object.fromEntries(['install','runtime','controls','provision','browser'].map(n=>[n,'success']))}));
    fs.writeFileSync(path.join(dir,'campaign.json'),JSON.stringify({node,replica:1,mode:'initial',acceptedForRelease:false,commit:'a'.repeat(40),runId:'1',attempt:'1',status:'passed',cycles:[{cycle:1,status:'passed'}]}));
    fs.writeFileSync(path.join(dir,'cycle-1/report.json'),JSON.stringify(report(node)));
  }
  return root;
}
test('Campaign resource bounds distinguish initial pair from planned stability cycles',()=>{
  assert.deepEqual(shape('initial'),{replicas:1,cycles:1});assert.deepEqual(shape('stability'),{replicas:3,cycles:2});assert.throws(()=>shape('unbounded'));
});
test('Aggregate accepts complete modeled Linux evidence without granting release acceptance',()=>{
  const root=matrix();try{const value=aggregate(root,'initial');assert.equal(value.status,'passed');assert.equal(value.acceptedForRelease,false);assert.equal(value.expectedSessions,2);}finally{fs.rmSync(root,{recursive:true});}
});
test('Aggregate rejects missing jobs, skipped steps, mixed commits and incomplete browser proof',()=>{
  for(const alter of [
    root=>fs.rmSync(path.join(root,'26.5.0'),{recursive:true}),
    root=>{const p=path.join(root,'24.18.0/job-terminal.json'),v=JSON.parse(fs.readFileSync(p));v.outcomes.browser='skipped';fs.writeFileSync(p,JSON.stringify(v));},
    root=>{const p=path.join(root,'24.18.0/campaign.json'),v=JSON.parse(fs.readFileSync(p));v.commit='b'.repeat(40);fs.writeFileSync(p,JSON.stringify(v));},
    root=>fs.rmSync(path.join(root,'24.18.0/cycle-1/report.json'))
  ]){const root=matrix();try{alter(root);assert.equal(aggregate(root,'initial').status,'failed');}finally{fs.rmSync(root,{recursive:true});}}
});
test('Mac, sandbox absence, cleanup errors and nested skips never qualify as Linux pass',()=>{
  const base=report('24.18.0');assert(accepted(base,'24.18.0'));
  for(const alter of [r=>r.platform='darwin',r=>r.phases.sandbox.status='infrastructure-blocked',r=>r.cleanup.complete=false,
    r=>r.qualification.cases.core.status='not-run',r=>r.qualification.cases.core.result={status:'passed',skipped:1},r=>r.acceptedForRelease=true]){
    const value=structuredClone(base);alter(value);assert(!accepted(value,'24.18.0'));
  }
});
