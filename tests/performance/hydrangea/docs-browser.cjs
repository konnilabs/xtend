'use strict';
const fs = require('fs');
const path = require('path');
const { runFixture } = require('../../../tools/browser-hypervisor');
const rootDir = path.resolve(__dirname, '../../..');
const preloadScript = `
window.__hydrangea = { active: 0, maxActive: 0, requests: [], boots: [], errors: [] };
window.addEventListener('error', event => window.__hydrangea.errors.push(String(event.message)));
window.addEventListener('unhandledrejection', event => window.__hydrangea.errors.push(String(event.reason)));
window.addEventListener('xtend-docs-rmt-playground-maraca-boot', () => window.__hydrangea.boots.push(performance.now()));
const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  const kind = /xtend-rmt-playground=(compile|diagnostics)/.exec(String(input))?.[1];
  if (!kind) return originalFetch.call(this, input, init);
  const data = JSON.parse(init.body);
  const entry = { kind, bytes: new TextEncoder().encode(data.source).length, sourceHash: data.clientCompile?.sourceHash, started: performance.now() };
  const state = window.__hydrangea;
  state.requests.push(entry); state.active++; state.maxActive = Math.max(state.maxActive, state.active);
  try { return await originalFetch.call(this, input, init); }
  finally { state.active--; entry.finished = performance.now(); }
};`;
const script = `
(async () => {
 const state = window.__hydrangea;
 const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
 const until = async predicate => { const end = performance.now()+40000; while (!predicate()) { if(performance.now()>end) throw new Error('Docs browser condition timed out: '+JSON.stringify({compile:window.xtendDocsRmtPlaygroundLastCompile,errors:state.errors,requests:state.requests})); await wait(25); } };
 try {
  await until(() => window.xtendDocsRmtPlaygroundLastCompile?.ok && state.boots.length);
  const find = (selector, scope=document) => { const match=scope.querySelector(selector); if(match)return match; for(const node of scope.querySelectorAll('*')) { if(node.shadowRoot) {const nested=find(selector,node.shadowRoot);if(nested)return nested;} } return null; };
  const root = find('[data-rmt-playground-root]');
  const editor = root.querySelector('[data-rmt-playground-editor]');
  const original = editor.value || editor.getAttribute('value') || editor.shadowRoot?.querySelector('textarea')?.value;
  if(typeof original!=='string')throw new Error('Editor source unavailable');
  const beforeBoots = state.boots.length;
  let latest;
  for (let i=0;i<10;i++) {
   latest = original+'\\n// hydrangea browser edit '+i;
   editor.dispatchEvent(new CustomEvent('textarea-changed',{detail:{value:latest}}));
   await wait(50);
  }
  const bytes = new TextEncoder().encode(latest).length;
  await until(() => {const last=state.requests.filter(r=>r.kind==='compile').at(-1);return last?.bytes===bytes && last.finished && window.xtendDocsRmtPlaygroundLastCompile?.sourceHash===last.sourceHash && state.boots.length>beforeBoots && !state.active;});
  if(state.maxActive!==1) throw new Error('Overlapping Playground HTTP requests');
  const preset = root.querySelector('[data-rmt-playground-preset]');
  const beforePreset = state.boots.length;
  preset.value='customer-service-kernel';
  preset.dispatchEvent(new CustomEvent('select-changed',{detail:{value:'customer-service-kernel'}}));
  await until(()=>window.xtendDocsRmtPlaygroundLastCompile?.maraca?.summary?.surfaceCount===15 && state.boots.length>beforePreset && !state.active);
  const beforeRun=state.requests.length;
  root.querySelector('[data-rmt-playground-run]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
  await until(()=>state.requests.length>beforeRun);
  root.__xtendDocsDispose();
  await wait(500);
  if(state.active!==0) throw new Error('Route disposal leaked fetches');
  window.__hydrangeaResult={status:'passed',maxActive:state.maxActive,requestCount:state.requests.length,boots:state.boots,requests:state.requests,errors:state.errors};
 } catch(error) { window.__hydrangeaResult={status:'failed',failure:error.message,errors:state.errors}; }
})();`;
runFixture({ rootDir, engine: 'chromium', url: process.env.HYDRANGEA_DOCS_URL || 'http://127.0.0.1:8081/docs/de/learn-rmt-playground',
  preloadScript, scripts: [{ script }], resultKey: '__hydrangeaResult', timeoutMs: 90000,
  driverLogPath: '/tmp/hydrangea-docs-driver.log'
}).then(result => {
  fs.writeFileSync(process.env.HYDRANGEA_BROWSER_REPORT || '/tmp/hydrangea-docs-browser.json', JSON.stringify(result, null, 2)+'\n');
  console.log(JSON.stringify(result.result));
  if(result.result.status !== 'passed') process.exitCode=1;
}).catch(error => {console.error(error);process.exitCode=1;});
