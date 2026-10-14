 'use strict';
const assert=require('node:assert/strict');
async function resourceCacheChecks({check,createPageClient,page,load}) {
 const {createPageResourceCache}=await load('page-resource-cache.mjs');
 await check('resource cache clones JSON, expires without sliding TTL and bounds LRU bytes',()=>{
  let time=0;const c=createPageResourceCache({ttlMs:100,maxEntries:2,maxBytes:60,now:()=>time});
  const value={value:'one'};c.set('a',value);value.value='changed';assert.equal(c.get('a').value,'one');const copy=c.get('a');copy.value='bad';assert.equal(c.get('a').value,'one');
  c.set('b',{value:'two'});c.get('a');c.set('c',{value:'three'});assert.equal(c.get('b'),null);assert.equal(c.stats().entries,2);assert.equal(c.set('large',{value:'x'.repeat(80)}),false);
  time=99;c.get('a');time=100;assert.equal(c.get('a'),null);assert.equal(c.stats().entries,0);assert(c.stats().bytes<=60);
  assert.throws(()=>c.set('date',new Date()));assert.throws(()=>c.set('fn',{f(){}}));assert.throws(()=>c.set('cycle',(()=>{const a={};a.a=a;return a;})()));assert.throws(()=>c.set('proto',JSON.parse('{"__proto__":{}}')));
  assert.throws(()=>c.set('nan',NaN));assert.throws(()=>createPageResourceCache({maxEntries:0}));c.set('short',{}, {ttlMs:1});time++;assert.equal(c.get('short'),null);assert(!Object.hasOwn(c.stats(),'keys'));
 });
 const tick=()=>new Promise(r=>setImmediate(r));
 function setup(extra={}){
  const handlers={};const win={location:new URL('http://localhost/start'),scrollX:0,scrollY:20,addEventListener(n,h){handlers[n]=h;},removeEventListener(){},scrollTo(x,y){this.scrollX=x;this.scrollY=y;},history:{state:{},replaceState(state,_,url){this.state=state;win.location=new URL(url,win.location);},pushState(state,_,url){this.replaceState(state,_,url);}}};
  let requests=0,clears=0;const client=createPageClient({initialPage:page('start'),window:win,render:async()=>{},fetch:async url=>{requests++;return Response.json(page(new URL(url).pathname.slice(1)));},resourceCache:{resolve:async(_,ctx)=>ctx.cache==='reuse'?{value:'cached'}:null,project:(data,ctx)=>page(new URL(win.location.origin+'/saved').pathname.slice(1),{url:'/saved',props:data}),clear(){clears++;}},...extra});return {client,handlers,win,requests:()=>requests,clears:()=>clears};
 }
 await check('resource reuse owns navigation, history, disposal; default visits remain fresh',async()=>{
  const x=setup();await x.client.visit('/saved',{cache:'reuse'});assert.equal(x.requests(),0);assert.equal(x.client.page.props.value,'cached');assert.equal(x.win.location.pathname,'/saved');assert(!JSON.stringify(x.win.history.state).includes('cached'));
  await x.client.visit('/network');assert.equal(x.requests(),1);x.win.location=new URL('http://localhost/saved');x.handlers.popstate({state:x.win.history.state});for(let i=0;i<50&&x.client.page.url!=='/saved';i++)await tick();assert.equal(x.requests(),1);assert.equal(x.client.page.url,'/saved');x.client.invalidate();assert.equal(x.clears(),1);x.client.dispose();assert.equal(x.clears(),2);
 });
 await check('resource cache rejects cross-context, SSR and failed validation; protected pages still fetch',async()=>{
  for(const invalid of [{contextKey:'other'},{version:'other'},{url:'https://other.test/saved'},{partial:true},{csrfToken:'secret'},{ssr:{}}]){
   const x=setup({resourceCache:{resolve:()=>({}),project:()=>page('saved',invalid),clear(){}}});await x.client.visit('/saved',{cache:'reuse'});assert.equal(x.requests(),1);x.client.dispose();
  }
  let resolved=0;const x=setup({initialPage:page('start',{csrfToken:'live'}),resourceCache:{resolve(){resolved++;return {};},project(){throw new Error('must not project');},clear(){}}});await x.client.visit('/saved',{cache:'reuse'});assert.equal(resolved,0);assert.equal(x.requests(),1);x.client.dispose();
 });
 await check('slow resource restore cannot overwrite newer navigation or disposed client',async()=>{
  for(const dispose of [false,true]){
   let release,signal;const x=setup({resourceCache:{resolve:async(url,ctx)=>{if(url.endsWith('/slow')){signal=ctx.signal;await new Promise(r=>release=r);return {};}return null;},project:()=>page('slow'),clear(){}}});
   const waiting=x.client.visit('/slow',{cache:'reuse'});while(!release)await tick();if(dispose)x.client.dispose();else await x.client.visit('/fast');assert(signal.aborted);release();assert.equal(await waiting,null);assert.equal(x.client.page.page,dispose?'start':'fast');x.client.dispose();
  }
 });
 await check('two-view RMT example compiles through strict Maraca App Services',async()=>{
  const path=require('node:path'),rootDir=path.resolve(__dirname,'../..');
  const {buildMaracaBundleAsync}=require('../../xtend-maraca');
  const result=await buildMaracaBundleAsync({source:'examples/page-resource-cache/app.rmt',out:'.xtend-test-results/page-resource-cache-example',profile:'production',orchestration:'strict',kernel:'strict',kernelBootMode:'direct',services:{clientEntry:'examples/page-resource-cache/services.ts',targets:['browser'],strict:true}},{rootDir});
  assert.equal(result.ok,true,JSON.stringify(result.plan?.diagnostics));
 });
 await check('generic local Maraca services reuse two views without application-specific policy',async()=>{
  const {createDemoServices}=await import('../../examples/page-resource-cache/services.mjs');const {createAppServiceRegistry}=await import('../../xtend-maraca/app-services.mjs');const {services,cache}=createDemoServices();const registry=createAppServiceRegistry(services,{historyLimit:0});
  await registry.invoke('demo.cache.write',{key:'public:v1:a',value:{title:'A'}});await registry.invoke('demo.cache.write',{key:'public:v1:b',value:{title:'B'}});assert.equal((await registry.invoke('demo.cache.read',{key:'public:v1:a'})).title,'A');assert.equal((await registry.invoke('demo.cache.read',{key:'public:v1:b'})).title,'B');registry.dispose();cache.clear();assert.equal(cache.stats().entries,0);
 });
}
module.exports={resourceCacheChecks};
