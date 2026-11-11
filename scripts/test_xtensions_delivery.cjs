#!/usr/bin/env node
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), { createRequire } = require('node:module');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function runDeliveryAcceptance({ rootDir = path.resolve(__dirname, '..'), peerRoot = process.env.XTENSIONS_TEST_PEERS, executablePath = process.env.CHROME_BIN, builds } = {}) {
  if (!peerRoot || !executablePath) throw new Error('Delivery acceptance requires isolated peers and actual Chromium; no skip is allowed.');
  const peers = createRequire(path.join(peerRoot, 'package.json')), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-delivery-'));
  const reports = {}, plans = {}, directories = {}, cases = [], foreignRequests = [], requests = [];
  let browser, server, foreign;
  try {
    for (const framework of ['react', 'vue', 'mixed']) {
      const directory = builds ? path.join(builds, 'build-' + framework) : path.join(temp, framework);
      if (!builds) {
        const reference = require('../development/rmtx-a04/integration-reference.cjs');
        const built = await require('../xtend-maraca').buildMaracaBundleAsync(reference.withDeliveryProfile(reference.createBuildInput(framework, directory, { profile: framework === 'vue' ? 'max' : 'production' })), { rootDir });
        assert(built.ok, JSON.stringify(built.plan.diagnostics));
      }
      const report = JSON.parse(fs.readFileSync(path.join(directory, 'xtend.xtensions.report.json')));
      assert.equal(report.schema, 'xtend.maraca.xtension-composition-build-report.v6');
      const deliveryBytes = fs.readFileSync(path.join(directory, report.deliveryFile)), delivery = JSON.parse(deliveryBytes);
      assert.equal(hash(deliveryBytes), report.files.find(row => row.fileName === report.deliveryFile).sha256);
      assert.deepEqual(delivery.files, report.files.filter(row => row.fileName === report.artifact.entryFile || row.fileName.startsWith('providers/')).sort((a,b)=>a.fileName<b.fileName?-1:1));
      for (const row of delivery.files) { const bytes = fs.readFileSync(path.join(directory, row.fileName)); assert.equal(hash(bytes), row.sha256); assert.equal(bytes.length, row.bytes); }
      reports[framework] = report; plans[framework] = delivery; directories[framework] = directory;
    }
    foreign = http.createServer((req, res) => { foreignRequests.push(req.url); res.writeHead(200, { 'Content-Type': 'text/javascript', 'Access-Control-Allow-Origin': '*' }); res.end('export default 1;'); });
    await new Promise(resolve => foreign.listen(0, '127.0.0.1', resolve));
    const foreignOrigin = 'http://127.0.0.1:' + foreign.address().port;
    const harness = await require('esbuild').build({ stdin: { contents: `
      const React = require('react'), ReactDOM = {...require('react-dom/client'),version:require('react-dom').version}, Vue = require('vue');
      const {createXtendFabric} = require('./fabric/xtend-fabric');
      const {createRepeatedDataSourceAdapter} = require('./development/rmtx-a02/repeated-filters');
      window.__XTendMaracaDisableAutoBoot = true;
      const violations = []; document.addEventListener('securitypolicyviolation', event => violations.push({directive:event.effectiveDirective,blockedURI:event.blockedURI}));
      window.__deliveryResult = (async () => {
        const parts=location.pathname.split('/'), scenario=parts[2], framework=parts[3], base=new URL('.',location.href);
        const stats={loads:0,factories:0,admissions:0,violations,booted:false,inputs:0,probes:{}};
        const actual=createXtendFabric(),fabric={...actual,createBoundary(...args){const boundary=actual.createBoundary(...args);return {...boundary,run(phase,task,metadata){if(metadata?.kernelJobId)stats.admissions++;return boundary.run(phase,task,metadata);}};}};
        globalThis.__XTendA043Observe=()=>{if(!stats.admissions)throw new Error('Factory bypassed native admission');stats.factories++;};
        const generated=await import(new URL('xtend.maraca.mjs',base).href),app=generated.createXtendMaraca({windowTarget:window,documentTarget:document,platformTarget:{}});
        const ids=framework==='mixed'?['mixed-filter-0','mixed-filter-1']:['filter-panel'];
        const grants=Object.fromEntries(ids.map(id=>[id,{work:{scan:{lane:'background'}},workBudget:{schema:'xtend.xtensions.work-budget-policy.v1',maxPending:1,work:{scan:{maxPending:1}}}}]));
        try {await app.boot({root:document.querySelector('main'),fabric,dataSourceAdapters:{rest:createRepeatedDataSourceAdapter()},xtensions:{grants,loadPeerGroup({group}){stats.loads++;return group.framework==='react'?{React,ReactDOM}:{Vue};}}});stats.booted=true;stats.inputs=document.querySelectorAll('input').length;}
        catch(error){stats.error=String(error);}
        if(scenario==='probes') {
          try{Function('return 1')();stats.probes.eval=false;}catch(_){stats.probes.eval=true;}
          const inline=document.createElement('script');inline.textContent='window.__inlineDeliveryProbe=1';document.body.append(inline);stats.probes.inline=!window.__inlineDeliveryProbe;
          const button=document.createElement('button');button.setAttribute('onclick','window.__attrDeliveryProbe=1');document.body.append(button);button.click();stats.probes.attribute=!window.__attrDeliveryProbe;
          const blob=URL.createObjectURL(new Blob(['export default 1'],{type:'text/javascript'}));
          for(const [key,url] of [['blob',blob],['data','data:text/javascript,export default 1'],['foreign',${JSON.stringify(foreignOrigin + '/external.mjs')}]]){try{await import(url);stats.probes[key]=false;}catch(_){stats.probes[key]=true;}}
          URL.revokeObjectURL(blob);
          const before=document.baseURI,baseTag=document.createElement('base');baseTag.href=${JSON.stringify(foreignOrigin + '/')};document.head.append(baseTag);stats.probes.base=document.baseURI===before;
        }
        app.dispose();await app.facade.whenXTensionsIdle();stats.afterDispose=document.querySelectorAll('input').length;
        delete globalThis.__XTendA043Observe;await new Promise(resolve=>setTimeout(resolve,20));return stats;
      })().catch(error=>({fatal:String(error)}));`, resolveDir: rootDir }, nodePaths: [path.join(peerRoot, 'node_modules')], bundle: true, platform: 'browser', write: false,
      define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' } });
    let origin;
    server = http.createServer((req, res) => {
      const url = new URL(req.url, origin), match = url.pathname.match(/^\/cases\/(ok|entry-block|helper-block|mime|tamper|probes)\/(react|vue|mixed)\/(.+)$/);
      if (!match) { res.writeHead(404); return res.end(); }
      const [, scenario, framework, fileName] = match, delivery = plans[framework], prefix = `/cases/${scenario}/${framework}/`;
      requests.push({ scenario, framework, fileName });
      const headers = { ...delivery.headers, 'Cache-Control': 'no-store' };
      if (scenario === 'entry-block' || scenario === 'helper-block') {
        const files = ['harness.js', ...listFiles(directories[framework]).filter(file => /\.(?:m?js)$/.test(file) && !(scenario === 'entry-block' ? file.startsWith('providers/') : file.includes('/format.mjs-')))];
        const sources = files.map(file => origin + prefix + file).join(' ');
        headers['Content-Security-Policy'] = `script-src ${sources}; script-src-elem ${sources}; script-src-attr 'none'; object-src 'none'; base-uri 'none'`;
      }
      if (fileName === 'index.html') { res.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<!doctype html><html><head></head><body><main></main><script src="./harness.js"></script></body></html>'); }
      if (fileName === 'harness.js') { res.writeHead(200, { ...headers, 'Content-Type': delivery.javascriptContentType }); return res.end(harness.outputFiles[0].contents); }
      const target = path.resolve(directories[framework], fileName);
      if (!target.startsWith(directories[framework] + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404, headers); return res.end(); }
      let bytes = fs.readFileSync(target);
      if (scenario === 'tamper' && fileName.includes('/format.mjs-')) bytes = Buffer.concat([bytes, Buffer.from('\n// changed during delivery\n')]);
      const contentType = scenario === 'mime' && fileName.startsWith('providers/') ? 'text/plain' : fileName.endsWith('.json') ? 'application/json' : delivery.javascriptContentType;
      res.writeHead(200, { ...headers, 'Content-Type': contentType }); res.end(bytes);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); origin = 'http://127.0.0.1:' + server.address().port;
    browser = await peers('playwright').chromium.launch({ executablePath, headless: true });
    for (const [scenario, frameworks] of [['ok',['react','vue','mixed']],['entry-block',['react','vue']],['helper-block',['react','vue']],['mime',['react','vue']],['tamper',['react','vue']],['probes',['mixed']]]) for (const framework of frameworks) {
      const context = await browser.newContext({ serviceWorkers: 'block' }), page = await context.newPage(), observed = [], pending = [];
      const delivery = plans[framework], prefix = `/cases/${scenario}/${framework}/`, expected = new Map(delivery.files.map(row => [row.fileName, row]));
      page.on('response', response => {
        const url = new URL(response.url()), fileName = url.pathname.slice(prefix.length);
        if (url.origin !== origin || !url.pathname.startsWith(prefix) || !expected.has(fileName) && !fileName.startsWith('providers/')) return;
        pending.push((async () => { try { const bytes = await response.body(), headers = await response.allHeaders(); observed.push({ fileName, bytes: bytes.length, sha256: hash(bytes), status: response.status(), contentType: headers['content-type'], nosniff: headers['x-content-type-options'], serviceWorker: response.fromServiceWorker() }); } catch (_) {} })());
      });
      try {
        const response = await page.goto(origin + prefix + 'index.html'); assert.equal(response.headers()['content-security-policy'].includes("'unsafe-"), false);
        const stats = await page.evaluate(() => window.__deliveryResult); assert(!stats.fatal, stats.fatal); await Promise.all(pending);
        const mismatches = observed.filter(row => { const wanted = expected.get(row.fileName); return !wanted || row.bytes !== wanted.bytes || row.sha256 !== wanted.sha256; });
        if (['ok','tamper','probes'].includes(scenario)) {
          assert(stats.booted, stats.error); assert.equal(stats.inputs, framework === 'mixed' ? 2 : 3); assert.equal(stats.loads, framework === 'mixed' ? 2 : 1); assert.equal(stats.factories, stats.inputs); assert(stats.admissions > 0);
          assert.equal(stats.afterDispose, 0); assert.deepEqual(observed.map(row => row.fileName).sort(), [...expected.keys()].sort());
          assert(observed.every(row => row.status === 200 && row.nosniff === 'nosniff' && row.contentType === delivery.javascriptContentType && !row.serviceWorker));
          assert.equal(mismatches.length, scenario === 'tamper' ? 1 : 0);
        } else {
          assert(!stats.booted, 'Rejected delivery must fail boot'); assert(stats.admissions > 0); assert.equal(stats.loads, 0); assert.equal(stats.factories, 0); assert.equal(stats.afterDispose, 0);
          if (scenario !== 'mime') assert(stats.violations.some(row => row.blockedURI.includes('/providers/')), 'Browser CSP blocks the actual provider graph');
          if (scenario === 'entry-block') assert(!requests.some(row => row.scenario === scenario && row.framework === framework && row.fileName.startsWith('providers/')), 'Blocked provider request never reaches HTTP server');
          if (scenario === 'helper-block') assert(!requests.some(row => row.scenario === scenario && row.framework === framework && row.fileName.includes('/format.mjs-')), 'Blocked transitive helper never reaches HTTP server');
        }
        if (scenario === 'probes') { assert(Object.values(stats.probes).every(Boolean)); assert.equal(Object.keys(stats.probes).length, 7); assert.equal(foreignRequests.length, 0); assert(stats.violations.some(row => row.directive === 'base-uri')); }
        cases.push({ name: `A04.3.4: ${framework} ${scenario}`, passed: true, framework, scenario, stats, responseAudit: { scope: 'observed-composition-responses', files: observed.sort((a,b)=>a.fileName.localeCompare(b.fileName)), mismatches: mismatches.map(row=>row.fileName), matchesBuild: observed.length === expected.size && new Set(observed.map(row=>row.fileName)).size === expected.size && !mismatches.length } });
      } finally { await context.close(); }
    }
    return { schema: 'xtend.xtensions.delivery-acceptance-report.v1', ok: true, node: process.version, browser: await browser.version(), checks: cases.length, productionByteIntegrityEnforced: false, cases };
  } finally {
    if (browser) await browser.close();
    for (const instance of [server, foreign]) if (instance) { instance.closeAllConnections(); await new Promise(resolve => instance.close(resolve)); }
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
function listFiles(directory, prefix = '') { return fs.readdirSync(path.join(directory,prefix), {withFileTypes:true}).flatMap(row => row.isDirectory() ? listFiles(directory,prefix+row.name+'/') : [prefix+row.name]); }
if (require.main === module) runDeliveryAcceptance().then(report => { const index=process.argv.indexOf('--report'); if(index!==-1)fs.writeFileSync(process.argv[index+1],JSON.stringify(report,null,2)+'\n');console.log(`A04.3.4: ${report.checks} real HTTP/CSP cases pass on ${report.node} / Chromium ${report.browser}.`); }).catch(error=>{console.error(error);process.exitCode=1;});
module.exports = { runDeliveryAcceptance };
