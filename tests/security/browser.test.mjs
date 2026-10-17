import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import sandboxedBrowser from './sandboxed-browser.cjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import staticFiles from '../../security/static-files.cjs';
import {createRmtNodeSsrAdapter} from '../../xtendrmt/rmt-node-ssr-adapter.js';

test('Chromium reparses production sanitizer output and preserves TrustedHTML through the runtime sink', async () => {
  const root=fileURLToPath(new URL('../..',import.meta.url));
  const ssr=createRmtNodeSsrAdapter();
  let ssrHtml='';
  for (const html of ['<svg/onload=alert(1)></svg><p>SSR safe</p>', '<a href="java&#x73;cript:alert(1)">SSR link</a>', '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">']) ssrHtml+=(await ssr.render({descriptor:{type:'html',trustBoundary:'xtend.security.sanitizing-boundary.v1',html}})).html;
  const script=`import {createHtmlSanitizer} from '/xtendrmt/html-sanitizer.mjs';
import {createRmtTemplateRuntimeRenderer} from '/xtendrmt/rmt-runtime.esm.js';
try {
 const sanitize=createHtmlSanitizer(window);
 const payload='<svg/onload=alert(1)></svg><a href="java&#x73;cript:alert(1)">safe</a><img/src=x/onerror=alert(1)>';
 const result=sanitize(payload);
 if(!result.ok || !trustedTypes.isHTML(result.html)) throw Error('Expected sanitized TrustedHTML');
 const root=document.getElementById('target');
 const renderer=createRmtTemplateRuntimeRenderer({documentTarget:document,sanitizeHtmlOutput:sanitize});
 renderer.applyBindings({rootId:'test',element:root,slots:[{name:'html',kind:'html_fragment',target:'[data-slot="html"]',source:'html'}],modelSnapshot:{html:payload}});
 const target=root.querySelector('[data-slot="html"]');
 if(!target.textContent.includes('safe') || target.querySelector('svg,math,script')) throw Error('Invalid rendered fragment');
 for(const element of target.querySelectorAll('*')) for(const attribute of element.attributes) if(/^on/.test(attribute.name)||/javascript:/.test(attribute.value)) throw Error('Active parsed attribute');
 const verdict=renderer.listTrustVerdicts().find(v=>v.sink==='slot.html');
 if(!verdict?.commitAllowed) throw Error('Trusted Types commit failed');
 const ssr=document.getElementById('ssr');
 if(!ssr.textContent.includes('SSR safe') || ssr.querySelector('svg,math,script,style')) throw Error('Unsafe browser-parsed SSR output');
 for(const element of ssr.querySelectorAll('*')) for(const attribute of element.attributes) if(/^on/.test(attribute.name)||/javascript:/.test(attribute.value)) throw Error('Unsafe SSR attribute');
 document.body.dataset.securityResult='passed';
} catch(error){document.body.dataset.securityResult='failed';document.body.append(String(error.stack));}`;
  const server=http.createServer((request,response)=>{
    if(request.url==='/') {
      response.writeHead(200,{'content-type':'text/html','content-security-policy':"default-src 'self'; script-src 'self'; object-src 'none'; require-trusted-types-for 'script'; trusted-types dompurify"});
      response.end(`<!doctype html><body><div id="target"><div data-slot="html"></div></div><div id="ssr">${ssrHtml}</div><script type="module" src="/test.mjs"></script></body>`);return;
    }
    if(request.url==='/test.mjs'){response.writeHead(200,{'content-type':'text/javascript'});response.end(script);return;}
    const file=staticFiles.resolvePublicFile(root,request.url.slice(1));
    staticFiles.streamPublicFile(response,file,{'content-type':'text/javascript'});
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  let child,launch;
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-security-browser-')); 
  try {
    launch=sandboxedBrowser.launchSandboxedBrowser(profile);child=launch.child;
    let errors='';let launchError;child.stderr.on('data',chunk=>errors+=chunk);child.on('error',error=>{launchError=error;errors+=error.stack;});
    const deadline=Date.now()+30000;
    const wait=()=>new Promise(resolve=>setTimeout(resolve,100));
    let address;
    while(Date.now()<deadline && !address && !launchError && child.exitCode===null) {address=/DevTools listening on (ws:\/\/\S+)/.exec(errors)?.[1];await wait();}
    assert.ok(address,errors);
    const endpoint=new URL(address);
    assert.equal(endpoint.protocol,'ws:');assert.equal(endpoint.hostname,'127.0.0.1');
    assert.equal(endpoint.username,'');assert.equal(endpoint.password,'');
    const socket=new WebSocket(address);await once(socket,'open',{signal:AbortSignal.timeout(10000)});
    let nextId=0;const pending=new Map();
    socket.addEventListener('message',event=>{const result=JSON.parse(event.data);const handler=pending.get(result.id);if(handler){pending.delete(result.id);result.error?handler.reject(Error(JSON.stringify(result.error))):handler.resolve(result.result);}});
    const command=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
      const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,sessionId}));
      const timer=setTimeout(()=>{if(pending.delete(id))reject(Error(`Browser command timed out: ${method}\n${errors}`));},10000);timer.unref();
    });
    try {
      const {targetId}=await command('Target.createTarget',{url:'about:blank'});
      const {sessionId}=await command('Target.attachToTarget',{targetId,flatten:true});
      await command('Page.enable',{},sessionId);
      await command('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`},sessionId);
      let result;
      while(Date.now()<deadline){result=await command('Runtime.evaluate',{expression:'JSON.stringify({result:document.body?.dataset.securityResult,html:document.body?.outerHTML})',returnByValue:true},sessionId);if(JSON.parse(result.result.value).result)break;await wait();}
      const output=JSON.parse(result.result.value);assert.equal(output.result,'passed',output.html);
      const proof=await sandboxedBrowser.verifySandbox(command,child,launch.identity);
      if(process.env.XTEND_CORE_BROWSER_PROOF)fs.writeFileSync(process.env.XTEND_CORE_BROWSER_PROOF,
        JSON.stringify({...proof,argv:launch.argv,sanitizerTrustedTypes:'passed'})+'\n',{flag:'wx'});
    } finally {socket.close();}
  } finally {
    try {await launch?.stop();}
    finally {
      server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
      fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
    }
  }
});
