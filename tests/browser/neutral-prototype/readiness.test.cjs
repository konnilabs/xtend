'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const root=path.resolve(__dirname,'../../..');
// Execute the actual fixture readiness code, stopping before any product assertion.
for(const [file,fn,next] of [
 ['core-flows-smoke.html','runCoreSmokeChecks','router'],
 ['a11y-focus-keyboard-smoke.html','runA11yKeyboardSmokeChecks','detailLink']
]){
 const source=fs.readFileSync(path.join(root,'tests/browser/fixtures',file),'utf8');
 const start=source.indexOf(`async function ${fn}() {`),end=source.indexOf(`      const ${next} =`,start);
 assert(start>=0 && end>start,'Fixture readiness boundary changed');
 const code=source.slice(source.indexOf('{',start)+1,end);
 const readiness=new AsyncFunction('window','waitFor','getComputedStyle','document','customElements',code);
 const invoke=(window,waitFor)=>readiness(window,waitFor,()=>({visibility:'visible',opacity:'1'}),{body:{}},{get:()=>true});
 test(file+': load does not enter product readiness before the actual boot promise settles',async()=>{
  let resolve,entered=false;const window={__XTendLoaderBootPromise:new Promise(r=>{resolve=r;})};
  const pending=invoke(window,()=>{entered=true;});
  await Promise.resolve();assert.equal(entered,false);resolve({});await pending;assert.equal(entered,true);
 });
 test(file+': missing or rejected boot cannot be counted as readiness',async()=>{
  const forbidden=()=>assert.fail('Product readiness must not run after failed boot');
  await assert.rejects(invoke({},forbidden),/boot promise is missing/);
  await assert.rejects(invoke({__XTendLoaderBootPromise:Promise.reject(Error('boot failed'))},forbidden),/boot failed/);
 });
 test(file+': fulfilled but incomplete boot remains non-ready without throwing on missing XTend',async()=>{
  let predicate;
  const window={__XTendLoaderBootPromise:Promise.resolve({})};
  await invoke(window,value=>{predicate=value;});
  assert.equal(Boolean(predicate()),false);
  window.XTend={};assert.equal(Boolean(predicate()),false);
  Object.assign(window,{XTend:{state:{},compliance:{}},XToast:{},XAlert:{},XDialog:{},XModal:{},XTheme:{}});
  assert.equal(Boolean(predicate()),true);
 });
}
