#!/usr/bin/env node
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http'), assert = require('node:assert/strict');
const { createRequire } = require('node:module'), { createHash, webcrypto } = require('node:crypto');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function runSSRAcceptance({ rootDir = path.resolve(__dirname, '..'), peerRoot = process.env.XTENSIONS_TEST_PEERS, executablePath = process.env.CHROME_BIN } = {}) {
  if (!peerRoot || !executablePath) throw new Error('SSR acceptance requires actual server peers and Chromium; no skip.');
  const peers = createRequire(path.join(peerRoot, 'package.json')), { JSDOM } = peers('jsdom'), api = require('../xtend-maraca/xtension-composition');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a05-')), cases = [], fixtures = new Map();
  let browser, server;
  async function check(name, callback) { await callback(); cases.push({ name, passed: true }); }
  const keys = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await webcrypto.subtle.exportKey('jwk', keys.publicKey);
  const sign = async value => Buffer.from(await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, Buffer.from(value))).toString('hex');
  try {
    const vendor = await require('esbuild').build({ stdin: { contents: "import React from 'react';import * as client from 'react-dom/client';import * as dom from 'react-dom';import * as Vue from 'vue';const ReactDOM={...client,version:dom.version};export {React,ReactDOM,Vue};", resolveDir: rootDir }, nodePaths: [path.join(peerRoot, 'node_modules')], bundle: true, format: 'esm', platform: 'browser', write: false, define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' } });
    for (const framework of ['react', 'vue', 'mixed']) {
      const directory = path.join(temp, framework); fs.mkdirSync(directory);
      const fixture = require('../development/rmtx-a04/runtime-reference.cjs').createRuntimeReference(framework, directory, { pwa: false, services: false });
      // Real framework-generated IDs, including Vue's application idPrefix.
      for (const row of fixture.input.xtensionComposition.modules) {
        if (!/component\.mjs$/.test(row.module)) continue;
        const file = path.join(fixture.rootDir, row.module); let text = fs.readFileSync(file, 'utf8');
        if (row.module.includes('react')) text = text.replace('return function FilterPanel', "if(globalThis.__XTendA05Async) return () => React.createElement(React.Suspense,{fallback:null},React.createElement('span',null,'boundary')); return function FilterPanel").replace('return function FilterPanel({ query, activeId, xtension }) {', 'return function FilterPanel({ query, activeId, xtension }) { const inputId = React.useId(); if(globalThis.__XTendA05Crash) throw new Error(\'A05 component fault\'); React.useEffect(()=>{globalThis.__XTendA05Effect?.(xtension);},[]);').replace("React.createElement('input', {", "React.createElement('input', { id: inputId,");
        else text = text.replace('return { props:', "if(globalThis.__XTendA05Async) return {async setup(){return ()=>Vue.h('span',null,'async');}}; return { props:").replace('setup(props) {', 'setup(props) { const inputId = Vue.useId(); if(globalThis.__XTendA05Crash) throw new Error(\'A05 component fault\');').replace("Vue.h('input', {", "Vue.h('input', { id: inputId,");
        text = text.replace(/formatValue\((?:props\.)?query, (?:props\.)?activeId\)/g, match => '(globalThis.__XTendA05Text || ' + match + ')');
        fs.writeFileSync(file, text); row.sha256 = hash(text);
      }
      const build = await require('../xtend-maraca').buildMaracaBundleAsync(fixture.input, { rootDir: fixture.rootDir });
      assert(build.ok, JSON.stringify(build.plan.diagnostics));
      assert(build.sizeBudgetReport.framework.bytes <= 2200000 && build.sizeBudgetReport.xtensions.runtimeBytes <= 240000, 'SSR keeps the fixed complete framework/runtime ceilings.');
      const grants = Object.fromEntries(build.plan.xtensionComposition.hosts.map(row => [row.declarationId, { work: { scan: { lane: 'background' } }, workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: { scan: { maxPending: 1 } } } }]));
      const initialState = JSON.parse(JSON.stringify(build.plan.state));
      if (framework === 'mixed') initialState['filter.left'].query = 'server-left';
      else initialState.groups.items[0].filters[0].query = 'server-numeric';
      let admissions = 0, loads = 0;
      const options = { build, initialState, generation: framework + '-request', sign,
        fabric: { createBoundary() { return { run(_name, task, metadata) { if (metadata?.kernelJobId) admissions++; return task(); } }; } },
        xtensions: { grants, loadPeerGroup({ group }) { loads++; return group.framework === 'react' ? { React: peers('react'), ReactDOMServer: peers('react-dom/server') } : { Vue: peers('vue'), VueServerRenderer: peers('vue/server-renderer'), vueServerRendererVersion: peers('vue/package.json').version }; } } };
      const dom = new JSDOM('<main id="xtend-maraca-root"></main>', { url: 'http://localhost/' });
      let response;
      await check(framework + ': real Node SSR renders through Kernel/Fabric and records keyed provider/Model identity', async () => {
        response = await api.renderMaracaXTensionSSR({ ...options, documentTarget: dom.window.document, root: dom.window.document.querySelector('main') });
        assert.equal(response.report.status, 'server-rendered'); assert(admissions >= response.snapshot.payload.hosts.length); assert(loads > 0);
        assert.equal(response.snapshot.payload.hosts.length, framework === 'mixed' ? 2 : 3);
        assert(response.html.includes('server-')); assert(response.html.includes('id="')); assert(response.snapshot.payload.hosts.every(row => row.identifierPrefix.includes(framework + '-request')));
        assert.equal(new Set(Array.from(dom.window.document.querySelectorAll('input'), node => node.id)).size, response.snapshot.payload.hosts.length);
        assert.equal(response.snapshot.payload.hosts[0].props.query, framework === 'mixed' ? 'server-left' : 'server-numeric');
      });
      dom.window.close();
      await check(framework + ': stable prefixes distinguish app roots in the same generation', async () => {
        const artifact = JSON.parse(fs.readFileSync(path.join(build.plan.outputDir, 'xtend.xtensions.report.json'))).artifact;
        const bindingsRuntime = require('../tools/xtensions/state-binding'), contract = require('../tools/xtensions/state-binding-contract');
        const { createMaracaXTensionSSRSession } = await import('../xtend-maraca/xtension-ssr-runtime.mjs');
        const document = new JSDOM('<main id=\"first-root\"></main><main id=\"second-root\"></main>'), prefixes=[];
        try { for (const root of document.window.document.querySelectorAll('main')) {
          const session = createMaracaXTensionSSRSession({artifact, bindingsRuntime, resumeBindingsRuntime: {...bindingsRuntime,...contract}, options:{schema:'xtend.maraca.xtension-ssr-options.v1',mode:'server',generation:options.generation,sign}});
          await session.prepare(root); session.confirmRestored({states:initialState});
          const entry = bindingsRuntime.materializeStateBindingArtifact(bindingsRuntime.validateStateBindingArtifact(artifact.plan.bindings,artifact.plan.program),{states:initialState})[0], container=document.window.document.createElement('div');root.append(container);
          prefixes.push(session.hostContext({identity:{address:entry.binding.address},container},artifact.manifest.providers[0]).identifierPrefix);session.dispose();
        } assert.notEqual(prefixes[0],prefixes[1]); } finally {document.window.close();}
      });
      await check(framework + ': deferred framework adoption is outside the synchronous SSR profile', async () => {
        const document = new JSDOM('<main id=\"xtend-maraca-root\"></main>');
        globalThis.__XTendA05Async = true;
        try { await assert.rejects(api.renderMaracaXTensionSSR({ ...options, documentTarget: document.window.document, root: document.window.document.querySelector('main') })); }
        finally { delete globalThis.__XTendA05Async; document.window.close(); }
      });
      await check(framework + ': serialized build reports cannot confer Node SSR authority', async () => { await assert.rejects(api.renderMaracaXTensionSSR({ ...options, build: JSON.parse(JSON.stringify(build)) })); });
      await check(framework + ': altered output bytes fail before framework loading', async () => {
        const file = path.join(build.plan.outputDir, 'runtime/xtension-platform.mjs'), before = fs.readFileSync(file), previous = loads;
        try { fs.appendFileSync(file, '\n// altered'); await assert.rejects(api.renderMaracaXTensionSSR(options), /bytes changed/); assert.equal(loads, previous); } finally { fs.writeFileSync(file, before); }
      });
      const variants = {};
      for (const [scenario, mutate] of Object.entries({ 'signed-props': payload => { payload.hosts[0].props.query = 'different'; }, 'signed-provider': payload => { payload.hosts[0].version = '2.0.0'; }, 'signed-duplicate': payload => { payload.hosts[1] = structuredClone(payload.hosts[0]); }, 'signed-state': payload => { payload.state.unrecognized = true; } })) {
        const payload = structuredClone(response.snapshot.payload); mutate(payload); variants[scenario] = { ...response.snapshot, payload, signature: await sign(require('../xtend-maraca/xtension-composition-contract.mjs').canonical(payload)) };
      }
      const bootstrap = await require('esbuild').build({ stdin: { contents: `
        import {React,ReactDOM,Vue} from './vendor.mjs';
        const {createXtendFabric}=require('./fabric/xtend-fabric');const {createRepeatedDataSourceAdapter}=require('./development/rmtx-a02/repeated-filters');
        window.__XTendMaracaDisableAutoBoot=true;
        const generated=await import('./xtend.maraca.mjs');const fixture=await (await fetch('./fixture.json')).json();
        window.__runSSR=async function(scenario){
          const root=document.querySelector('main'),all=Array.from(root.querySelectorAll('*')),inputs=Array.from(root.querySelectorAll('input')),first=inputs[0];
          const snapshot=structuredClone(fixture.variants[scenario]||fixture.snapshot),before=root.outerHTML;let loads=0,admissions=0,effectWork=0,effectFailures=0;
          globalThis.__XTendA05Effect=cap=>{cap.work.schedule('scan',()=>true).result.then(()=>effectWork++,()=>effectFailures++);};
          const original=createXtendFabric(),fabric={...original,createBoundary(...args){const b=original.createBoundary(...args);return {...b,run(name,fn,metadata){if(metadata?.kernelJobId)admissions++;return b.run(name,fn,metadata);}};}};
          const app=generated.createXtendMaraca({windowTarget:window,documentTarget:document,platformTarget:{}});window.__ssrApp=app;
          let queue=[];const row=snapshot.payload.hosts[0];
          const intent={schema:'xtend.maraca.xtension-ssr-intent.v1',id:'early-input',generation:snapshot.payload.generation,address:row.address,event:'change',payload:${framework === 'mixed' ? "{filter:{query:'typed-before-hydration',selection:{activeId:null}}}" : "{query:'typed-before-hydration'}"}};
          if(scenario==='replay'||scenario==='duplicate'||scenario==='wrong-intent'||scenario==='conflicting-intent'){first.value='typed-before-hydration';first.focus();queue=[intent];if(scenario==='duplicate')queue.push(structuredClone(intent));if(scenario==='wrong-intent')intent.generation='other';if(scenario==='conflicting-intent')queue.push({...intent,payload:{}});}
          if(scenario==='signature')snapshot.signature='00';if(scenario==='source')snapshot.payload.sourceHash='0'.repeat(64);if(scenario==='expired')snapshot.payload.expiresAt=1;
          if(scenario==='key-type')snapshot.payload.hosts[0].address.keys=snapshot.payload.hosts[0].address.keys.map(x=>typeof x==='number'?String(x):x);
          if(scenario==='framework-error'||scenario==='hydrate-error')globalThis.__XTendA05Crash=true;
          if(scenario==='hydration-repair')globalThis.__XTendA05Text='client-text-differs';
          if(scenario==='dom-reject'||scenario==='fallback'||scenario==='framework-error')first.parentNode.append(document.createElement('em'));
          if(scenario==='shell')root.append(document.createElement('aside'));
          const changed=root.outerHTML;const publicKey=await crypto.subtle.importKey('jwk',fixture.jwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
          let release;const wait=new Promise(resolve=>release=resolve);
          const verify=async(text,signature)=>{if(scenario==='cancel-verify'){window.__verifyEntered=true;await wait;}return typeof signature==='string'&&signature.length===128&&crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,Uint8Array.from(signature.match(/../g)||[],x=>parseInt(x,16)),new TextEncoder().encode(text));};
          const pending=app.boot({root,fabric,dataSourceAdapters:{rest:createRepeatedDataSourceAdapter()},xtensions:{grants:fixture.grants,ssr:{schema:'xtend.maraca.xtension-ssr-options.v1',mode:'client',snapshot,verify,fallback:scenario==='fallback'||scenario==='framework-error'?'mount':'reject',intents:()=>queue},async loadPeerGroup({group}){loads++;if(scenario==='late-dom')first.parentNode.append(document.createElement('em'));if(scenario==='late-container')first.closest('[data-maraca-surface]').setAttribute('data-unexpected','changed');return group.framework==='react'?{React,ReactDOM}:{Vue};}}});
          if(scenario==='cancel-verify'){while(!window.__verifyEntered)await new Promise(resolve=>setTimeout(resolve,1));app.dispose();release();}
          let result,error,reordered=false,renewed=false;try{result=await pending;await app.facade.whenXTensionsIdle();
            if(scenario==='reorder'||scenario==='renew'){let groups=structuredClone(app.facade.model.snapshot().states.groups);if(scenario==='reorder'){groups.items[0].filters.reverse();await app.facade.dispatchCommand('groups.replace',{groups});reordered=inputs.every(node=>Array.from(root.querySelectorAll('input')).includes(node));}else{const removed=groups.items[0].filters.shift();await app.facade.dispatchCommand('groups.replace',{groups});groups=structuredClone(app.facade.model.snapshot().states.groups);groups.items[0].filters.unshift(removed);await app.facade.dispatchCommand('groups.replace',{groups});renewed=root.querySelector('input')!==first&&root.querySelectorAll('input')[1]===inputs[1];}await app.facade.whenXTensionsIdle();}
          }catch(e){error=String(e.message);}
          if(!error){const deadline=performance.now()+10000;while(effectWork+effectFailures<${framework === 'react' ? 3 : framework === 'mixed' ? 1 : 0}&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,5));}
          const report=app.facade.snapshot()?.xtensionSSR||result?.xtensionSSR||null,after=Array.from(root.querySelectorAll('*'));
          const stats={error,report,loads,admissions,effectWork,effectFailures,reordered,renewed,values:Array.from(root.querySelectorAll('input'),n=>n.value),ids:Array.from(root.querySelectorAll('input'),n=>n.id),preserved:all.length===after.length&&all.every((node,i)=>node===after[i]),firstPreserved:root.querySelector('input')===first,siblingPreserved:root.querySelectorAll('input')[1]===inputs[1],focus:document.activeElement===first,unchanged:root.outerHTML===changed,state:app.facade.model?.snapshot(),resources:result?.kernel?.resources};
          app.dispose();await app.facade.whenXTensionsIdle();stats.remaining=root.querySelectorAll('input').length;return stats;
        };window.__ssrReady=true;
      `, resolveDir: rootDir }, external: ['./vendor.mjs', './xtend.maraca.mjs'], bundle: true, format: 'esm', platform: 'browser', write: false });
      fixtures.set(framework, { build, response, variants, grants, bootstrap: bootstrap.outputFiles[0].contents, vendor: vendor.outputFiles[0].contents });
    }
    server = http.createServer((req, res) => {
      const parts = req.url.split('/').filter(Boolean), fixture = fixtures.get(parts[0]); if (!fixture) { res.writeHead(404); return res.end(); }
      const file = parts.slice(1).join('/');
      if (!file || file === 'index.html') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html>' + fixture.response.html + '<script type="module" src="./bootstrap.mjs"></script>'); }
      if (file === 'fixture.json') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ snapshot: fixture.response.snapshot, grants: fixture.grants, variants: fixture.variants, jwk })); }
      res.setHeader('Content-Type', 'text/javascript');
      if (file === 'bootstrap.mjs') return res.end(fixture.bootstrap); if (file === 'vendor.mjs') return res.end(fixture.vendor);
      if (!/^[a-zA-Z0-9_.\/-]+$/.test(file) || file.split('/').includes('..')) { res.writeHead(404); return res.end(); }
      const target = path.join(fixture.build.plan.outputDir, file); if (!fs.existsSync(target)) { res.writeHead(404); return res.end(); } res.end(fs.readFileSync(target));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await peers('playwright').chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    for (const framework of fixtures.keys()) {
      for (const scenario of ['resume', 'replay', 'duplicate', ...(framework === 'mixed' ? [] : ['reorder', 'renew']), 'signed-props', 'signed-provider', 'signed-duplicate', 'signed-state', 'signature', 'source', 'expired', ...(framework === 'mixed' ? [] : ['key-type']), 'dom-reject', 'fallback', 'shell', 'wrong-intent', 'conflicting-intent', 'late-dom', 'late-container', 'framework-error', 'hydrate-error', 'hydration-repair', 'cancel-verify']) {
        await check(framework + ': native ' + scenario, async () => {
          const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
          try {
            await page.goto('http://127.0.0.1:' + server.address().port + '/' + framework + '/index.html'); await page.waitForFunction(() => window.__ssrReady === true);
            const result = await page.evaluate(scenario => window.__runSSR(scenario), scenario);
            assert.equal(errors.length, 0, errors.join('\n'));
            if (['resume', 'replay', 'duplicate', 'fallback', 'reorder', 'renew'].includes(scenario)) {
              assert(!result.error, JSON.stringify(result)); if(scenario==='resume'||scenario==='fallback'){assert.equal(result.effectFailures,0,framework+'/'+scenario+': '+JSON.stringify(result));assert(result.effectWork >= (framework === 'react' ? 3 : framework === 'mixed' ? 1 : 0), 'Passive React work executes after native host activation');} assert.equal(result.report.status, scenario === 'fallback' ? 'fallback-mounted' : 'resumed');
              assert.deepEqual(result.report.phases, ['verified', 'restored', 'adopted', 'replayed']); assert(result.admissions >= fixtures.get(framework).response.snapshot.payload.hosts.length);
              assert.equal(result.report.replayedIntents, scenario === 'replay' || scenario === 'duplicate' ? 1 : 0);
              if (scenario === 'fallback') { assert(!result.firstPreserved); assert(result.siblingPreserved); assert.equal(result.report.hosts[0].result.nodeIdentityPreserved, false); }
              else if (scenario === 'reorder') assert(result.reordered);
              else if (scenario === 'renew') assert(result.renewed);
              else { assert(result.preserved, JSON.stringify(result)); assert(result.report.hosts.every(row => row.result.nodeIdentityPreserved)); }
              if (scenario === 'replay' || scenario === 'duplicate') { assert.equal(result.values[0], 'typed-before-hydration'); assert(result.focus); }
              else if (scenario !== 'reorder') assert.equal(result.values[0], framework === 'mixed' ? 'server-left' : 'server-numeric');
              assert.equal(new Set(result.ids).size, result.ids.length); assert.equal(result.remaining, 0);
            } else {
              assert(result.error, JSON.stringify(result));
              if (['signed-props', 'signed-provider', 'signed-duplicate', 'signed-state', 'signature', 'source', 'expired', 'key-type', 'dom-reject', 'shell', 'cancel-verify'].includes(scenario)) { assert.equal(result.loads, 0); assert(result.unchanged, JSON.stringify(result)); }
              assert(!result.report || result.report.status !== 'resumed');
            }
          } finally { await page.close(); }
        });
      }
    }
    return { schema: 'xtend.xtensions.ssr-acceptance-report.v1', apiVersion: '1.0.0', ok: true, node: process.version, browser: browser.version(), checks: cases.length, cases, frameworks: ['react', 'vue'], ownership: 'exclusive-container', signedSnapshotRequired: true, restoreBeforeReplay: true, releaseAccepted: false, sizes: Object.fromEntries([...fixtures].map(([name, fixture]) => [name, { runtimeBytes: fixture.build.sizeBudgetReport.xtensions.runtimeBytes, frameworkBytes: fixture.build.sizeBudgetReport.framework.bytes }])) };
  } finally { if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); }
}
if (require.main === module) runSSRAcceptance().then(report => { const index = process.argv.indexOf('--report'); if (index >= 0) fs.writeFileSync(process.argv[index + 1], JSON.stringify(report, null, 2) + '\n'); console.log(`A05: ${report.checks} actual Node SSR/Chromium checks passed.`); }).catch(error => { console.error(error.stack?.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, 'captured-ssr.mjs') || error); process.exitCode = 1; });
module.exports = { runSSRAcceptance };
