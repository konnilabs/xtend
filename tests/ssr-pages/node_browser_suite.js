'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createServer}=require('node:http');
const {once}=require('node:events');
const {runFixture}=require('../../tools/browser-hypervisor');
const {createSuiteContext}=require('../utils/assertions');
const {createBrowserManifest}=require('./browser_manifest');
async function runNodePageBrowserSuite(options={}) {
  const rootDir=options.rootDir || path.resolve(__dirname,'../..');
  const context=createSuiteContext({id:'ssr-pages-browser',label:'Shared page lifecycle in Chromium'});
  const {createNodePageHost}=await import('../../xtendrmt/node-page-host.mjs');
  const {Prop}=await import('../../xtendrmt/page-contract.mjs');
  const manifest=await createBrowserManifest(); let user='guest',flash=null;
  const {generateKeyPairSync,sign}=require('node:crypto');
  const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const orders=[{id:1,name:'Active order',active:true},{id:2,name:'Inactive order',active:false}];
  async function readBody(request) {
    let bytes=0;const chunks=[];for await(const chunk of request){bytes+=chunk.length;if(bytes>1024*1024)throw new Error('Fixture upload limit');chunks.push(chunk);}
    const body=new Request('http://localhost',{method:'POST',headers:request.headers,body:Buffer.concat(chunks)});
    return (request.headers['content-type']||'').includes('multipart/form-data')?Object.fromEntries(await body.formData()):await body.json();
  }
  const host=createNodePageHost({manifest,createContext:()=>({contextKey:user}),share:()=>({testHost:'node',resumePublicKey:publicKey.export({format:'jwk'})}),validate:async ctx=>{
    const data=await readBody(ctx.request);return {errors:String(data.name||'').length<3?{name:['Name is too short.']}: {}};
  },resolvePage:async ctx=>{
    const request=ctx.request,url=new URL(request.url,'http://localhost');
    if(url.pathname==='/resume')return {page:'Login',props:{title:'Resume'},renderOptions:{executionMode:'server_prerender_resume',resume:{sign:canonical=>({algorithm:'ECDSA-P256-SHA256',keyId:'browser-fixture',signature:sign('sha256',Buffer.from(canonical),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url')})}}};
    if(url.pathname==='/orders/export' && user!=='guest')return {download:require('node:stream').Readable.from(['order,name\n1,Active order']),headers:{'Content-Type':'text/csv','Content-Disposition':'attachment; filename="orders.csv"'}};
    if(request.method==='POST') {
      const data=await readBody(request);
      if(url.pathname==='/login'){user='alice';return {redirect:'/orders'};}
      if(url.pathname==='/logout'){user='guest';return {redirect:'/login'};}
      if(String(data.name||'').length<3)return {page:'Detail',props:{title:'Detail',name:data.name},errors:{edit:{name:['Name is too short.']}}};
      orders[0].name=data.name;flash={success:`Saved ${data.attachment?.name || 'order'}`};return {redirect:'/orders/1'};
    }
    if(user==='guest')return url.pathname==='/login'?{page:'Login',props:{title:'Login'}}:{redirect:'/login'};
    const currentFlash=ctx.selection.prefetch?{}:flash; if(!ctx.selection.prefetch)flash=null;
    if(url.pathname==='/orders')return {page:'Orders',props:{title:'Orders',orders:url.searchParams.get('filter')==='active'?orders.filter(row=>row.active):orders,statistics:Prop.defer(async()=> 'Deferred ready','stats')},flash:currentFlash};
    return {page:'Detail',props:{title:'Detail',name:orders[0].name},flash:currentFlash};
  }});
  const server=createServer(async(req,res)=>{
    try {
      const name=new URL(req.url,'http://localhost').pathname;
      if(name==='/test/version'){manifest.version=req.method==='DELETE'?'browser-v1':'browser-v2';res.end();return;}
      let file;if(name==='/browser_entry.mjs')file=path.join(__dirname,'browser_entry.mjs');
      else if(['/runtime/xrouter.js','/runtime/xtend-state.js'].includes(name))file=path.join(rootDir,'components',path.basename(name));
      else if(/^\/runtime\/[a-z0-9-]+\.(?:m?js)$/u.test(name))file=path.join(rootDir,'xtendrmt',name.slice('/runtime/'.length));
      if(file){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(file));return;}
      if(!await host.handle(req,res)){res.statusCode=404;res.end();}
    }catch(error){res.statusCode=500;res.end(error.message);}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  try {
    const result=await runFixture({engine:'chromium',url:`http://127.0.0.1:${server.address().port}/login`,resultKey:'__XTEND_PAGE_BROWSER__',timeoutMs:60000,...options.browser});
    for(const check of result.result.checks || [])context.pass(check);
    if(!result.result.ok)context.fail(result.result.error || 'Missing browser success');
    const resume=await runFixture({engine:'chromium',url:`http://127.0.0.1:${server.address().port}/resume`,resultKey:'__XTEND_PAGE_BROWSER__',timeoutMs:30000,...options.browser});
    for(const check of resume.result.checks || [])context.pass(check);
    if(!resume.result.ok)context.fail(resume.result.error || 'Missing resume success');
  }catch(error){context.fail(error.stack || String(error));}
  finally{host.dispose();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  return context.result();
}
if(require.main===module)runNodePageBrowserSuite().then(result=>{console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;});
module.exports={runNodePageBrowserSuite};
