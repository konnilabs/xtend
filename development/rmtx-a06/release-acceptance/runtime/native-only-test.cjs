'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { createHash, webcrypto } = require('node:crypto');
const reference = require('./reference.cjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function runNativeOnly({ peerRoot = process.env.XTENSIONS_TEST_PEERS,
  executablePath = process.env.CHROME_BIN, browser: suppliedBrowser } = {}) {
  if (!peerRoot || !executablePath) throw new Error('Native-only SSR requires actual peers and Chromium; no skip.');
  peerRoot = path.resolve(peerRoot);
  const peers = createRequire(path.join(peerRoot, 'package.json'));
  const { JSDOM } = peers('jsdom');
  const api = require('../../../../xtend-maraca/xtension-composition');
  const maraca = require('../../../../xtend-maraca');
  const { createXtendFabric } = require('../../../../fabric/xtend-fabric');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a0662-native-'));
  const names = [];
  let server, ownBrowser, fabric;
  async function check(name, callback) {
    try { await callback(); names.push(name); }
    catch (error) { console.error('A06.6.2 case failed:', name); error.message = name + ': ' + error.message; throw error; }
  }
  try {
    const input = { ...reference.createInput(path.join(temporary, 'build')),
      source: 'development/rmtx-a06/release-acceptance/runtime/native-only.rmtx' };
    const built = await maraca.buildMaracaRmtxSSRBundleAsync({ schema: 'xtend.maraca.rmtx-ssr-build-options.v1', input }, { rootDir: reference.rootDir });
    assert.equal(built.ok, true, JSON.stringify({ status: built.status, diagnostics: built.diagnostics }));
    const build = built.build;
    await check('native-only production SSR keeps its real project and has no synthetic framework composition', async () => {
      assert.equal(build.plan.xtensionComposition, undefined);
      assert.equal(built.sourceIdentity.sourceProfile.version, '8.0.0');
    });
    const keys = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await webcrypto.subtle.exportKey('jwk', keys.publicKey);
    const sign = async value => Buffer.from(await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, Buffer.from(value))).toString('hex');
    fabric = createXtendFabric();
    const initialState = structuredClone(build.plan.state); initialState.capture.kind = 'native-server';
    const dom = new JSDOM('<main id="xtend-maraca-root"></main>', { url: 'http://localhost/' });
    let response;
    try {
      response = await api.renderMaracaXTensionSSR({ schema: 'xtend.maraca.xtension-ssr-render-options.v3', build,
        initialState, generation: 'native-only-request', sign, fabric, documentTarget: dom.window.document,
        root: dom.window.document.querySelector('main') });
      assert.equal(dom.window.customElements.get('x-header'), undefined);
      assert.equal(dom.window.customElements.get('x-button'), undefined);
    } finally { dom.window.close(); }
    await check('native-only Node SSR signs restored Light-DOM with no framework hosts or server custom-element execution', async () => {
      assert.equal(response.schema, 'xtend.maraca.xtension-ssr-response.v3');
      assert.deepEqual(response.snapshot.payload.hosts, []);
      assert.deepEqual(response.snapshot.payload.sourceIdentity, built.sourceIdentity);
      const document = new JSDOM(response.html);
      try {
        assert.equal(document.window.document.querySelector('[data-native-only]').textContent, 'native-server');
        assert.equal(document.window.document.querySelector('x-button').shadowRoot, null);
      } finally { document.window.close(); }
    });
    const entry = path.basename(build.plan.outputs.entry);
    const bootstrap = await peers('esbuild').build({ stdin: { contents: `
      import fabricApi from '../../../../fabric/xtend-fabric.js';
      window.__XTendMaracaDisableAutoBoot=true;
      const generated=await import('./${entry}');
      const fixture=await(await fetch('./fixture.json')).json();
      window.runNativeOnlySSR=async scenario=>{
        const root=document.querySelector('#xtend-maraca-root'),nodes=[...root.querySelectorAll('*')],header=root.querySelector('x-header'),button=root.querySelector('x-button');
        const nativePreActivated=!!header.shadowRoot||!!button.shadowRoot,snapshot=structuredClone(fixture.snapshot);
        const app=generated.createXtendRmtxSSR({windowTarget:window,documentTarget:document,platformTarget:{}}),fabric=fabricApi.createXtendFabric();
        if(scenario==='signature')snapshot.signature='00';
        if(scenario==='old-wire')snapshot.schema='xtend.maraca.xtension-ssr-snapshot.v2';
        if(scenario==='shell')root.append(document.createElement('aside'));
        if(scenario==='native-tamper')root.querySelector('[data-native-only]').textContent='unexpected';
        const before=root.outerHTML,key=await crypto.subtle.importKey('jwk',fixture.jwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
        let entered=false,release;const wait=new Promise(resolve=>release=resolve);
        const verify=async(text,signature)=>{if(scenario==='cancel'){entered=true;await wait;}return typeof signature==='string'&&signature.length===128&&crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,Uint8Array.from(signature.match(/../g)||[],value=>parseInt(value,16)),new TextEncoder().encode(text));};
        const pending=app.boot({root,fabric,xtensions:{ssr:{schema:'xtend.maraca.xtension-ssr-options.v3',mode:'client',snapshot,verify}}});
        if(scenario==='cancel'){while(!entered)await new Promise(resolve=>setTimeout(resolve,1));app.dispose();release();}
        let error,report;try{await pending;await app.facade.whenXTensionsIdle();report=app.facade.snapshot().xtensionSSR;
          if(scenario==='click'){button.shadowRoot.querySelector('button').click();const deadline=performance.now()+10000;while(app.facade.model.getState('capture').kind!=='click'){if(performance.now()>deadline)throw new Error('Native Classic Action did not execute.');await new Promise(resolve=>setTimeout(resolve,5));}await app.facade.whenXTensionsIdle();}
        }catch(failure){error=String(failure.message);}
        const result={error,report,nativePreActivated,nativeActive:!!button.shadowRoot,preserved:nodes.every(node=>root.contains(node)),unchanged:root.outerHTML===before,kind:app.facade.model?.getState('capture').kind,text:root.querySelector('[data-native-only]')?.textContent,
          frameworkBindings:!error?app.facade.getXTensionBindings().length:null};
        const model=app.facade.model;app.dispose();await app.facade.whenXTensionsIdle();
        const disposedState=JSON.stringify(model?.snapshot()),disposedFibers=JSON.stringify(fabric.getFibers());
        button.dispatchEvent(new CustomEvent('button-interaction',{detail:{type:'click'},bubbles:true,composed:true}));
        try{await app.facade.dispatchCommand('native.only',{value:'post-dispose'});result.postDisposeCommandRejected=false;}catch{result.postDisposeCommandRejected=true;}
        await app.facade.whenXTensionsIdle();result.postDisposeStateUnchanged=JSON.stringify(model?.snapshot())===disposedState;result.postDisposeFibersUnchanged=JSON.stringify(fabric.getFibers())===disposedFibers;
        fabric.dispose();result.remaining=root.querySelectorAll('x-header,x-button').length;return result;
      };window.nativeOnlyReady=true;`, resolveDir: __dirname }, external: ['./' + entry], bundle: true, platform: 'browser', format: 'esm', write: false });
    const appRoot = path.join(temporary, 'application'); fs.mkdirSync(appRoot);
    fs.writeFileSync(path.join(appRoot, 'bootstrap.mjs'), bootstrap.outputFiles[0].contents);
    const sealed = api.buildMaracaXTensionDeployment({ schema: 'xtend.maraca.xtension-deployment-config.v1', build,
      application: { rootDir: appRoot, bootstrap: { fileName: 'bootstrap.mjs', sha256: hash(bootstrap.outputFiles[0].contents) }, modules: [] },
      outputDir: path.join(temporary, 'public'), publicPath: '/native-only/' });
    const handler = api.createMaracaXTensionDeploymentHandler(sealed);
    const base = new JSDOM(fs.readFileSync(path.join(sealed.outputDir, sealed.manifest.documentFile), 'utf8'));
    let html;
    try { base.window.document.getElementById('xtend-maraca-root').replaceWith(JSDOM.fragment(response.html)); html = base.serialize(); }
    finally { base.window.close(); }
    server = http.createServer((req, res) => {
      if (req.url === '/native-only/' + sealed.manifest.documentFile) {
        for (const [key, value] of Object.entries(sealed.headers)) res.setHeader(key, value);
        res.setHeader('Content-Type', 'text/html'); return res.end(html);
      }
      if (req.url === '/native-only/fixture.json') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ snapshot: response.snapshot, jwk })); }
      handler(req, res);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = suppliedBrowser || (ownBrowser = await peers('playwright').chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] }));
    const results = {};
    for (const scenario of ['resume', 'click', 'signature', 'old-wire', 'shell', 'native-tamper', 'cancel']) {
      await check('native-only sealed browser: ' + scenario, async () => {
        const page = await browser.newPage(), errors = [], providerRequests = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', request => { if (/\/(?:providers|interfaces)\//u.test(new URL(request.url()).pathname)) providerRequests.push(request.url()); });
        try {
          await page.goto('http://127.0.0.1:' + server.address().port + '/native-only/' + sealed.manifest.documentFile);
          await page.waitForFunction(() => window.nativeOnlyReady);
          const result = await page.evaluate(value => window.runNativeOnlySSR(value), scenario); results[scenario] = result;
          assert.deepEqual(errors, []); assert.deepEqual(providerRequests, []); assert.equal(result.nativePreActivated, false);
          if (['resume', 'click'].includes(scenario)) {
            assert.equal(result.error, undefined, JSON.stringify(result)); assert.equal(result.nativeActive, true);
            assert.equal(result.report.schema, 'xtend.maraca.xtension-ssr-report.v3');
            assert.equal(result.frameworkBindings, 0);
            assert.deepEqual(result.report.phases, ['verified', 'restored', 'adopted', 'replayed']);
            assert.equal(result.preserved, true); assert.equal(result.kind, scenario === 'click' ? 'click' : 'native-server');
            assert.equal(result.text, result.kind);
            assert.equal(result.postDisposeCommandRejected, true);
            assert.equal(result.postDisposeStateUnchanged, true);
            assert.equal(result.postDisposeFibersUnchanged, true);
          } else {
            assert.equal(typeof result.error, 'string', JSON.stringify(result)); assert.equal(result.nativeActive, false); assert.equal(result.unchanged, true);
          }
        } finally { await page.close(); }
      });
    }
    return { schema: 'xtend.rmtx.native-only-ssr-runtime-acceptance.v1', node: process.version, passed: true,
      cases: names.length, names, sourceIdentity: built.sourceIdentity, results, acceptedForRelease: false };
  } finally {
    await ownBrowser?.close(); if (server) await new Promise(resolve => server.close(resolve));
    fabric?.dispose(); fs.rmSync(temporary, { recursive: true, force: true });
  }
}
if (require.main === module) runNativeOnly().then(report => console.log(JSON.stringify(report)))
  .catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { runNativeOnly };
