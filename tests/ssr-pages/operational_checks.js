'use strict';
const assert = require('node:assert/strict');
const {createServer, get} = require('node:http');
const {Readable} = require('node:stream');
const {once} = require('node:events');

async function operationalChecks({check, checkPhp, load, page, php}) {
  const {createNodePageHost} = await load('node-page-host.mjs');
  const {createPageClient} = await load('page-client.mjs');
  const {createPageForm} = await load('page-form.mjs');
  const {Prop, resolvePageProps, mergePageProps} = await load('page-contract.mjs');
  await check('optional host transitions preserve normal commits and reduced-motion behavior', async () => {
    for(const provided of [true,false])for(const reduced of [true,false]) {
      let transitions=0,renders=0;
      const client=createPageClient({initialPage:page('before'),window:{matchMedia:()=>({matches:reduced}),addEventListener(){},removeEventListener(){}},render:()=>{renders++;},...(provided?{transition:async update=>{transitions++;await update();}}:{})});
      try {await client.commit(page('after'),{transition:true});assert.equal(client.page.page,'after');assert.equal(renders,1);assert.equal(transitions,provided&&!reduced?1:0);}
      finally {client.dispose();}
    }
  });
  const manifest = {schema:'xtend.page-manifest.v1',version:'operational',pages:{Home:{input:{descriptor:{type:'text',text:'Hello'}}}}};
  const serve = async (options, run) => {
    const host = createNodePageHost({manifest, createContext:() => ({contextKey:'guest'}), ...options});
    const server = createServer((request,response) => host.handle(request,response));
    server.listen(0,'127.0.0.1'); await once(server,'listening');
    try { await run(`http://127.0.0.1:${server.address().port}`, host); }
    finally { host.dispose(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  };
  await check('Node request deadlines clean up a context that arrives after timeout exactly once', async () => {
    let finish, cleaned = 0;
    await serve({timeoutMs:40, cleanupTimeoutMs:20, createContext:() => new Promise(resolve => {finish=resolve;}), resolvePage:() => {throw new Error('A timed out context must not reach routing.');}, cleanup:() => {cleaned++;}}, async url => {
      const response = await fetch(url); assert.equal(response.status,500);
      finish({contextKey:'late'});
      await new Promise(resolve => setTimeout(resolve,20));
      assert.equal(cleaned,1);
    });
  });
  await check('Node downloads apply backpressure and destroy only their source on disconnect', async () => {
    let source, produced = 0, cleanup = 0;
    await serve({resolvePage:() => ({download:source = new Readable({highWaterMark:16384, read() {produced++; this.push(Buffer.alloc(65536,65));}}),headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="data.bin"'}}), cleanup:() => {cleanup++;}}, async url => {
      await new Promise((resolve,reject) => {
        const request=get(url,response => {
          response.pause();
          setTimeout(() => {
            try { assert(produced < 1024, 'A paused consumer must not permit an unbounded producer.'); response.destroy(); resolve(); }
            catch(error) {reject(error);}
          },40);
        });
        request.on('error',reject);
      });
      for (let attempt=0;attempt<50 && !cleanup;attempt++) await new Promise(resolve => setTimeout(resolve,10));
      assert.equal(source.destroyed,true); assert.equal(cleanup,1);
    });
  });
  await check('provider failures and cleanup failures stay visible without becoming successful HTTP responses', async () => {
    const reports=[];
    await serve({resolvePage:() => ({page:'Home',props:{data:async()=>{throw new Error('provider failed');}}}), cleanup:()=>{throw new Error('cleanup failed');}, onError:error=>reports.push(error.message), onCleanupError:error=>reports.push(error.message)}, async url => {
      const response=await fetch(url); assert.equal(response.status,500); await response.text();
      assert.deepEqual(reports,['provider failed','cleanup failed']);
    });
  });
  await check('download navigation consumes one response and preserves the active page', async () => {
    let calls=0, delivered;
    const client=createPageClient({initialPage:page('start'),fetch:async()=>{calls++;return new Response('report contents',{headers:{'Content-Disposition':'attachment; filename="report.txt"','Content-Type':'text/plain'}});},onDownload:result=>{delivered=result;}});
    try { assert.equal(await client.visit('/report'),null); assert.equal(client.page.page,'start'); assert.equal(calls,1); assert.equal(delivered.filename,'report.txt'); assert.equal(await delivered.blob.text(),'report contents'); }
    finally {client.dispose();}
  });
  await check('a nested field reset preserves independent edits and unsafe cache sizes fail immediately', () => {
    const client=createPageClient({initialPage:page('edit')});
    const form=createPageForm({client,defaults:{user:{name:'Initial',email:'before'},items:[{label:'First'}]}});
    try {
      form.set('user.name','changed'); form.set('user.email','keep'); form.set('items[0].label','changed'); form.reset('user.name','items[0].label');
      assert.deepEqual(form.state.values,{user:{name:'Initial',email:'keep'},items:[{label:'First'}]});
      assert.throws(()=>createPageClient({initialPage:page('edit'),onceLimit:-1}),/positive integer/);
      assert.throws(()=>client.remember('__proto__',{secret:'bad'}),/Invalid page data key/);
    } finally {form.dispose();client.dispose();}
  });
  await check('older optimistic failures cannot roll back a later successful mutation', async () => {
    let rejectOld;
    const client=createPageClient({initialPage:page('edit',{props:{value:0}})});
    try {
      const old=client.optimistic(props=>({...props,value:1}),()=>new Promise((_,reject)=>{rejectOld=reject;}));
      const observed=old.catch(error=>error);
      while(!rejectOld) await new Promise(resolve=>setImmediate(resolve));
      await client.optimistic(props=>({...props,value:2}),async()=>page('edit',{props:{value:20}}));
      rejectOld(new Error('older mutation failed')); assert.match((await observed).message,/older/); assert.equal(client.page.props.value,20);
    } finally {client.dispose();}
  });
  await check('pagination merges by nested identity while keeping the filter and history URL', async () => {
    const client=createPageClient({initialPage:page('list',{url:'/list?filter=open',props:{rows:[{record:{id:1},name:'old'}]},pagination:{next:'/list?filter=open&cursor=2',previous:null,props:['rows']}}),fetch:async()=>Response.json(page('list',{url:'/list?filter=open&cursor=2',partial:true,props:{rows:[{record:{id:1},name:'updated'},{record:{id:2},name:'new'}]},merge:{rows:{mode:'append',key:'record.id'}},pagination:{next:null,previous:'/list?filter=open',props:['rows']}}))});
    try {await client.loadMore(); assert.equal(client.page.props.rows.length,2); assert.equal(client.page.props.rows[0].name,'updated'); assert.equal(client.page.url,'/list?filter=open&cursor=2'); assert.equal(await client.loadMore(),null);}
    finally {client.dispose();}
    assert.throws(()=>mergePageProps({rows:[null]},{rows:[{id:1}]},{rows:{mode:'append',key:'id'}}),/unique identities/);
  });
  await check('a context or build change releases page and layout resources and rejects partial cross-user data', async () => {
    const client=createPageClient({initialPage:page('same',{layout:'Shell'})}); const cleanup=[];
    try {
      client.registerResource(()=>cleanup.push('page'));client.registerResource(()=>cleanup.push('layout'),{layout:true});client.remember('draft',{value:'Alice'});
      await client.commit(page('same',{layout:'Shell',version:'2'}));assert.deepEqual(cleanup,['page','layout']);assert.equal(client.remember('draft'),null);
      await assert.rejects(client.commit(page('same',{partial:true,contextKey:'bob',version:'2'})),/authenticated context/);
      assert.equal(client.page.contextKey,'alice');
    } finally {client.dispose();}
  });
  await checkPhp('PHP and Node providers share selection, once TTL and literal string behavior', async () => {
    const records={plain:{kind:'value',value:'phpversion'},lazy:{kind:'lazy',value:1},later:{kind:'defer',group:'later',value:2},once:{kind:'once',value:3,options:{ttl:120,key:'lookup'}},rows:{kind:'merge',value:[{id:1}],options:{mode:'prepend',key:'id'}}};
    for (const selection of [{},{only:['lazy']},{deferred:['later']},{once:['lookup']}]) {
      const calls=[],input={};
      for(const [key,record] of Object.entries(records)) { const resolve=()=>{calls.push(key);return record.value;}; input[key]=record.kind==='value'?record.value:record.kind==='defer'?Prop.defer(resolve,record.group):Prop[record.kind](resolve,record.options); }
      const data=await resolvePageProps(input,{},selection), result=php({operation:'providers',records,selection});
      assert.deepEqual(JSON.parse(JSON.stringify(data)),result.data);assert.deepEqual(calls,result.calls);
    }
  });
  await check('a manifest built for a different Node runtime is rejected before serving', () => {
    assert.throws(()=>createNodePageHost({manifest:{...manifest,runtimeFingerprints:{node:{'page-contract.mjs':'invalid'}}}}),/incompatible/);
  });
  await check('background work shares a bounded request queue and cancelled entries do not consume capacity', async () => {
    const pending=[];let active=0,peak=0;
    const client=createPageClient({initialPage:page('same'),maxConcurrentRequests:1,maxQueuedRequests:1,fetch:()=>{active++;peak=Math.max(peak,active);return new Promise(resolve=>pending.push(()=>{active--;resolve(Response.json(page('same')));}));}});
    try {
      const first=client.request('/same');await new Promise(resolve=>setImmediate(resolve));
      const controller=new AbortController(), queued=client.request('/same',{signal:controller.signal});const cancelled=queued.catch(error=>error);
      await assert.rejects(client.request('/same'),/queue is full/);controller.abort();await cancelled;
      const next=client.request('/same');pending.shift()();await first;
      while(!pending.length)await new Promise(resolve=>setImmediate(resolve));pending.shift()();await next;assert.equal(peak,1);
    }finally{client.dispose();}
  });
}
module.exports={operationalChecks};
