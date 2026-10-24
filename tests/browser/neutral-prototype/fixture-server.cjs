'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const staticFiles = require('../../../security/static-files.cjs');
const root = path.resolve(__dirname,'../../..');
const csp = "default-src 'self'; script-src 'self'; object-src 'none'; require-trusted-types-for 'script'; trusted-types dompurify";
const {contentTypeFor}=require('../../../scripts/serve_xtend_dev');
const bidiDocument=`<!doctype html><script>
window.__pageSeen=true;
window.__earlyPreload=window.__neutralPreload?.readyState==='loading' && window.__neutralPreload.beforePage===true;
window.__bidiFixture={status:window.__hydrangea?'pending':'absent'};
if(window.__hydrangea)(async()=>{
 try {
  const payload=JSON.stringify({source:'synthetic fetch lifecycle',clientCompile:{sourceHash:'synthetic'}});
  for(const kind of ['compile','diagnostics'])await fetch('/__neutral/fetch?xtend-rmt-playground='+kind,{method:'POST',body:payload});
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20);
  try{await fetch('/__neutral/slow?xtend-rmt-playground=compile',{method:'POST',body:payload,signal:controller.signal});throw Error('Expected abort');}
  catch(error){if(error.name!=='AbortError')throw error;}finally{clearTimeout(timer);}
  const s=window.__hydrangea;
  window.__bidiFixture={status:'passed',early:window.__earlyPreload,active:s.active,maxActive:s.maxActive,
    requests:s.requests,errors:s.errors};
 }catch(error){window.__bidiFixture={status:'failed',error:String(error)};}
})();
</script>`;
// Reuse the maintained production assertions verbatim, with fail-closed extraction.
// Promotion should move the fixture to a shared module, with no duplicated assertions.
function maintainedScript() {
  const source = fs.readFileSync(path.join(root,'tests/security/browser.test.mjs'),'utf8');
  const match = /const script=`([\s\S]*?)`;\n  const server=/.exec(source);
  if (!match || match[1].includes('${')) throw Error('Maintained security fixture changed; review extraction');
  return match[1] + `\nwindow.__xtendNeutralSecurity = {status:document.body.dataset.securityResult,
    checks:[{passed:document.body.dataset.securityResult === 'passed',label:'maintained sanitizer, TrustedHTML sink and SSR reparse assertions'}],
    failure:document.body.dataset.securityResult === 'passed' ? null : document.body.textContent};`;
}
async function start() {
  const {createRmtNodeSsrAdapter} = require('../../../xtendrmt/rmt-node-ssr-adapter.js');
  const ssr = createRmtNodeSsrAdapter();
  let html = '';
  for (const payload of ['<svg/onload=alert(1)></svg><p>SSR safe</p>', '<a href="java&#x73;cript:alert(1)">SSR link</a>', '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">']) {
    html += (await ssr.render({descriptor:{type:'html',trustBoundary:'xtend.security.sanitizing-boundary.v1',html:payload}})).html;
  }
  const script = maintainedScript();
  const server = http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(pathname==='/__neutral/bidi'){res.writeHead(200,{'content-type':'text/html'});res.end(bidiDocument);return;}
    if(['/__neutral/fetch','/__neutral/slow'].includes(pathname)){
      req.resume();const done=()=>{if(!res.destroyed){res.writeHead(200,{'content-type':'application/json'});res.end('{}');}};
      if(pathname.endsWith('/slow')){const timer=setTimeout(done,500);res.once('close',()=>clearTimeout(timer));}else done();return;
    }
    if (req.url === '/__neutral/preflight') {res.writeHead(200,{'content-type':'text/html','content-security-policy':csp});res.end('<!doctype html><title>Capability preflight</title>');return;}
    if (req.url === '/__neutral/security') {res.writeHead(200,{'content-type':'text/html','content-security-policy':csp});res.end(`<!doctype html><body><div id="target"><div data-slot="html"></div></div><div id="ssr">${html}</div><script type="module" src="/__neutral/security.mjs"></script></body>`);return;}
    if (req.url === '/__neutral/security.mjs') {res.writeHead(200,{'content-type':'text/javascript'});res.end(script);return;}
    try {
      const allowed=/^\/(xtendrmt|security|components|api|demos|tests\/browser\/fixtures)\/[A-Za-z0-9_./-]+\.(m?js|cjs|html|json|css|svg|rmt)$/.test(pathname) || ['/xtend-loader.js','/xtend-classic-dev-api.js','/api.js','/xtend.css'].includes(pathname);
      if (!allowed || pathname.split('/').some(part=>part.startsWith('.'))) throw Error('Not a public fixture asset');
      const file = staticFiles.resolvePublicFile(root,pathname.slice(1));
      staticFiles.streamPublicFile(res,file,{'content-type':contentTypeFor(pathname),'cache-control':'no-store'});
    } catch (_) {res.writeHead(404);res.end();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {origin:`http://127.0.0.1:${server.address().port}`,stop:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
module.exports = {start, maintainedScript, csp};
