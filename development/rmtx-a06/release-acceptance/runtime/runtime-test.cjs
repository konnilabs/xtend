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

async function run({ peerRoot = process.env.XTENSIONS_TEST_PEERS, executablePath = process.env.CHROME_BIN } = {}) {
  if (!peerRoot || !executablePath) throw new Error('RMTX SSR acceptance requires actual isolated peers and Chromium; no skip.');
  peerRoot = path.resolve(peerRoot);
  const peers = createRequire(path.join(peerRoot, 'package.json'));
  const { JSDOM } = peers('jsdom');
  const esbuild = peers('esbuild');
  const api = require('../../../../xtend-maraca/xtension-composition');
  const { canonical } = require('../../../../xtend-maraca/xtension-composition-contract.mjs');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a0662-'));
  const names = [], results = {};
  let browser, server, serverFabric;
  async function check(name, callback) {
    try { await callback(); names.push(name); }
    catch (error) { console.error('A06.6.2 case failed:', name); error.message = name + ': ' + error.message; throw error; }
  }
  try {
    const sources = Object.fromEntries(['source.rmtx', 'native-only.rmtx', 'shared.rmt', 'reference.cjs', 'bootstrap.mjs', 'runtime-test.cjs', 'native-only-test.cjs'].map(file => [file, hash(fs.readFileSync(path.join(__dirname, file)))]));
    const built = await reference.build(path.join(temporary, 'build'));
    const budget = built.build?.sizeBudgetReport;
    assert.equal(built.ok, true, JSON.stringify({ status: built.status, diagnostics: built.diagnostics,
      buildStatus: built.build?.status, budget: budget && { ok: budget.ok, status: budget.status,
        framework: budget.framework, componentRuntimeBytes: budget.xtensions?.runtimeBytes,
        files: budget.accounting?.files?.filter(file => ['runtime/xtension-platform.mjs', 'runtime/xtend-maraca-native-view.mjs'].includes(file.fileName)) } }));
    assert.equal(built.schema, 'xtend.maraca.rmtx-ssr-build-result.v1');
    const build = built.build, entry = path.basename(build.plan.outputs.entry);
    await check('explicit production SSR build retains Source8 and the linked Classic project identity', async () => {
      assert.equal(built.sourceIdentity.sourceProfile.version, '8.0.0');
      assert.equal(built.sourceIdentity.project.schema, 'xtend.rmt.project-report.v1');
      const dependencies = new Set(built.project.dependencies.map(row => path.relative(reference.rootDir, row.filePath).replaceAll('\\', '/')));
      for (const required of [reference.source, reference.source.replace('source.rmtx', 'shared.rmt'),
        'development/rmtx-a06/providers/react-gallery.mjs', 'development/rmtx-a06/providers/vue-reviews.mjs']) {
        assert.equal(dependencies.has(required), true, 'Project identity must capture ' + required);
      }
      assert.equal(build.plan.orchestration.artifact.actions.actions.some(action => action.id === 'reviews.sort'), true);
      assert.equal(build.plan.orchestration.artifact.actions.actions.some(action => action.id === 'native.select'), true);
      assert.equal(build.sizeBudgetReport.framework.bytes <= 2200000, true);
      assert.equal(build.sizeBudgetReport.xtensions.runtimeBytes <= 280000, true);
      assert.equal(build.sizeBudgetReport.ok, true, JSON.stringify(build.sizeBudgetReport));
    });
    const keys = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await webcrypto.subtle.exportKey('jwk', keys.publicKey);
    const sign = async text => Buffer.from(await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, Buffer.from(text))).toString('hex');
    const grants = Object.fromEntries(build.plan.xtensionComposition.hosts.map(host => [host.declarationId, { work: { inspect: { lane: 'background' } } }]));
    const initialState = structuredClone(build.plan.state);
    initialState.catalog.items[0].title = 'Server numeric';
    initialState.catalog.items[0].selectedImageId = 'back';
    let admissions = 0, serverLoads = 0;
    serverFabric = require('../../../../fabric/xtend-fabric').createXtendFabric();
    const fabric = { ...serverFabric, createBoundary(...args) {
      const boundary = serverFabric.createBoundary(...args);
      return { ...boundary, run(name, task, metadata) {
        if (metadata?.kernelJobId) admissions++;
        return boundary.run(name, task, metadata);
      } };
    } };
    const options = { schema: 'xtend.maraca.xtension-ssr-render-options.v3', build, initialState,
      generation: 'rmtx-mixed-request', expiresInMs: 600000, sign,
      fabric, xtensions: { grants, loadPeerGroup({ group }) {
        serverLoads++;
        return group.framework === 'react'
          ? { React: peers('react'), ReactDOMServer: peers('react-dom/server') }
          : { Vue: peers('vue'), VueServerRenderer: peers('vue/server-renderer'), vueServerRendererVersion: peers('vue/package.json').version };
      } } };
    async function render(overrides = {}) {
      const dom = new JSDOM('<main id="xtend-maraca-root"></main>', { url: 'http://localhost/' });
      try {
        const response = await api.renderMaracaXTensionSSR({ ...options, ...overrides,
          documentTarget: dom.window.document, root: dom.window.document.querySelector('main') });
        assert.equal(dom.window.customElements.get('x-header'), undefined);
        assert.equal(dom.window.customElements.get('x-button'), undefined);
        return response;
      }
      finally { dom.window.close(); }
    }
    let response, empty;
    await check('real Node SSR renders native Light-DOM and four typed React/Vue roots through Kernel/Fabric', async () => {
      response = await render();
      assert.equal(response.schema, 'xtend.maraca.xtension-ssr-response.v3');
      assert.equal(response.snapshot.payload.hosts.length, 4);
      assert.deepEqual(response.snapshot.payload.sourceIdentity, built.sourceIdentity);
      assert.equal(response.snapshot.payload.hosts.some(host => host.address.keys[0] === 1), true);
      assert.equal(response.snapshot.payload.hosts.some(host => host.address.keys[0] === '1'), true);
      assert.equal(admissions >= 4, true); assert.equal(serverLoads, 2);
      assert.equal(serverFabric.getFibers().some(fiber => fiber.status === 'completed'), true);
      const dom = new JSDOM(response.html);
      try {
        assert.deepEqual([...dom.window.document.querySelectorAll('[data-native-title]')].map(node => node.textContent), ['Server numeric', 'Text']);
        assert.equal(dom.window.document.querySelectorAll('select').length, 4);
        assert.equal(dom.window.document.querySelectorAll('x-header').length, 2);
        assert.equal(dom.window.document.querySelectorAll('x-button').length, 2);
        assert.equal([...dom.window.document.querySelectorAll('x-button')].every(node => node.shadowRoot === null), true);
      } finally { dom.window.close(); }
    });
    await check('empty native and framework collections retain their declared source contract', async () => {
      empty = await render({ initialState: { ...initialState, catalog: { items: [] } }, generation: 'rmtx-empty-request' });
      assert.equal(empty.snapshot.payload.hosts.length, 0);
    });
    await check('serialized build reports cannot grant SSR authority', async () => {
      await assert.rejects(render({ build: JSON.parse(JSON.stringify(build)) }));
    });
    await check('modified captured platform bytes fail before loading framework peers', async () => {
      const file = path.join(build.plan.outputDir, 'runtime/xtension-platform.mjs'), before = fs.readFileSync(file), previous = serverLoads;
      try { fs.appendFileSync(file, '\n// unexpected bytes'); await assert.rejects(render(), /bytes changed/); assert.equal(serverLoads, previous); }
      finally { fs.writeFileSync(file, before); }
    });
    const variants = {};
    for (const [name, mutate] of Object.entries({
      'signed-owner': payload => { payload.hosts[0].ownerSurface = 'wrong-owner'; },
      'signed-owner-instance': payload => { payload.hosts[0].ownerInstance = 'wrong-instance'; },
      'signed-interface': payload => { payload.hosts[0].interfaceSha256 = '0'.repeat(64); },
      'signed-provider': payload => { payload.hosts[0].version = '99.0.0'; },
      'signed-props': payload => { payload.hosts[0].props.selectedImageId = 'wrong-image'; },
      'signed-key-type': payload => { payload.hosts[0].address.keys[0] = String(payload.hosts[0].address.keys[0]); },
      'signed-project': payload => { payload.sourceIdentity.project.identity = '0'.repeat(64); },
      'signed-source-profile': payload => { payload.sourceIdentity.sourceProfile.version = '7.0.0'; },
      'signed-state': payload => { payload.state.unrecognized = {}; },
      'signed-expired': payload => { payload.issuedAt = Date.now() - 600000; payload.expiresAt = Date.now() - 1; }
    })) {
      const payload = structuredClone(response.snapshot.payload); mutate(payload);
      variants[name] = { ...response.snapshot, payload, signature: await sign(canonical(payload)) };
    }
    const vendor = await esbuild.build({ stdin: { contents: "import React from 'react';import * as client from 'react-dom/client';import * as dom from 'react-dom';import * as Vue from 'vue';export {React,Vue};export const ReactDOM={...client,version:dom.version};", resolveDir: __dirname },
      nodePaths: [path.join(peerRoot, 'node_modules')], bundle: true, platform: 'browser', format: 'esm', write: false,
      define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' } });
    const bootstrap = await esbuild.build({ stdin: { contents: fs.readFileSync(path.join(__dirname, 'bootstrap.mjs'), 'utf8').replace('__ENTRY__', entry), resolveDir: __dirname },
      nodePaths: [path.join(peerRoot, 'node_modules')], external: ['./vendor.mjs', './' + entry, './runtime/xtension-platform.mjs'],
      bundle: true, platform: 'browser', format: 'esm', write: false });
    const appRoot = path.join(temporary, 'application'); fs.mkdirSync(appRoot);
    fs.writeFileSync(path.join(appRoot, 'bootstrap.mjs'), bootstrap.outputFiles[0].contents);
    fs.writeFileSync(path.join(appRoot, 'vendor.mjs'), vendor.outputFiles[0].contents);
    const sealed = api.buildMaracaXTensionDeployment({ schema: 'xtend.maraca.xtension-deployment-config.v1', build,
      application: { rootDir: appRoot, bootstrap: { fileName: 'bootstrap.mjs', sha256: hash(bootstrap.outputFiles[0].contents) },
        modules: [{ fileName: 'vendor.mjs', sha256: hash(vendor.outputFiles[0].contents) }] },
      outputDir: path.join(temporary, 'public'), publicPath: '/runtime/' });
    const handler = api.createMaracaXTensionDeploymentHandler(sealed);
    const documentBytes = fs.readFileSync(path.join(sealed.outputDir, sealed.manifest.documentFile), 'utf8');
    function html(value) {
      const dom = new JSDOM(documentBytes);
      try { dom.window.document.getElementById('xtend-maraca-root').replaceWith(JSDOM.fragment(value.html)); return dom.serialize(); }
      finally { dom.window.close(); }
    }
    server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://local'), value = url.searchParams.get('case') === 'empty' ? empty : response;
      if (url.pathname === '/runtime/' + sealed.manifest.documentFile) {
        for (const [key, header] of Object.entries(sealed.headers)) res.setHeader(key, header);
        res.setHeader('Content-Type', 'text/html'); return res.end(html(value));
      }
      if (url.pathname === '/runtime/fixture.json') {
        res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
        return res.end(JSON.stringify({ snapshot: value.snapshot, variants, grants, jwk }));
      }
      handler(req, res);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await peers('playwright').chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const successful = ['resume', 'replay', 'duplicate', 'image-replay', 'held', 'live', 'native', 'reorder', 'renew', 'fallback', 'empty'];
    const beforeLoadRejects = ['signed-owner', 'signed-owner-instance', 'signed-interface', 'signed-provider', 'signed-props', 'signed-key-type', 'signed-project', 'signed-source-profile', 'signed-state', 'signed-expired', 'signature', 'source', 'old-wire', 'shell', 'native-tamper', 'dom-reject', 'mount-invalid-identity', 'cancel'];
    const afterLoadRejects = ['wrong-payload', 'bad-key', 'bad-generation', 'conflict', 'invalid-batch', 'late-container', 'hydrate-error'];
    for (const scenario of [...successful, ...beforeLoadRejects, ...afterLoadRejects]) {
      await check('real sealed RMTX SSR browser: ' + scenario, async () => {
        const page = await browser.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
          await page.goto('http://127.0.0.1:' + server.address().port + '/runtime/' + sealed.manifest.documentFile + '?case=' + scenario);
          await page.waitForFunction(() => window.rmtxSSRReady);
          const result = await page.evaluate(value => window.runRmtxSSR(value), scenario);
          results[scenario] = result;
          assert.deepEqual(errors, [], errors.join('\n'));
          assert.equal(result.nativePreActivated, false, 'Importing the SSR client entry must not activate managed internals before verification.');
          if (successful.includes(scenario)) {
            assert.equal(result.error, undefined, JSON.stringify(result));
            assert.equal(result.report.schema, 'xtend.maraca.xtension-ssr-report.v3');
            assert.deepEqual(result.report.phases, ['verified', 'restored', 'adopted', 'replayed']);
            assert.equal(result.report.status, scenario === 'fallback' ? 'fallback-mounted' : 'resumed');
            assert.equal(result.report.replayedIntents, ['replay', 'duplicate', 'image-replay', 'held'].includes(scenario) ? 1 : 0);
            assert.equal(result.remainingFramework, 0, JSON.stringify(result));
            assert.equal(result.postDisposeCommandRejected, true);
            assert.equal(result.postDisposeStateUnchanged, true);
            assert.equal(result.postDisposeFibersUnchanged, true);
            if (scenario !== 'empty') {
              assert.equal(result.nativeActivated, true);
              assert.deepEqual(result.nativeTitles, scenario === 'reorder' ? ['Text', 'Server numeric'] : ['Server numeric', 'Text']);
            }
            if (['resume', 'replay', 'duplicate', 'image-replay', 'held'].includes(scenario)) assert.equal(result.preserved, true, JSON.stringify(result));
            if (scenario === 'reorder') assert.equal(result.reordered, true);
            if (scenario === 'renew') assert.equal(result.renewed, true);
            if (scenario === 'fallback') { assert.equal(result.firstPreserved, false); assert.equal(result.siblingPreserved, true); assert.equal(result.nativePreserved, true); }
            if (scenario === 'empty') assert.equal(result.loads, 0);
            if (['replay', 'duplicate'].includes(scenario)) assert.deepEqual(result.capture, { productId: '1', value: 'rating', kind: 'reviews' });
            if (['held', 'live'].includes(scenario)) assert.deepEqual(result.capture, { productId: 1, value: 'rating', kind: 'reviews' });
            if (scenario === 'image-replay') assert.deepEqual(result.capture, { productId: 1, value: 'front', kind: 'image' });
            if (scenario === 'native') assert.deepEqual(result.capture, { productId: 1, value: '', kind: 'native' });
          } else {
            assert.equal(typeof result.error, 'string', JSON.stringify(result));
            if (result.capture) assert.equal(result.capture.kind, '', 'No invalid batch may run a preceding valid model command.');
            if (beforeLoadRejects.includes(scenario)) {
              assert.equal(result.loads, 0); assert.equal(result.nativeInternalsPresent, false);
              assert.equal(result.unchanged, true, JSON.stringify(result));
            }
            assert.equal(result.report?.status === 'fallback-mounted', false);
          }
        } finally { await page.close(); }
      });
    }
    const nativeOnly = await require('./native-only-test.cjs').runNativeOnly({ peerRoot, executablePath, browser });
    names.push(...nativeOnly.names);
    const after = Object.fromEntries(Object.keys(sources).map(file => [file, hash(fs.readFileSync(path.join(__dirname, file)))]));
    assert.deepEqual(after, sources, 'Fixture inputs changed during actual acceptance.');
    const files = build.bundleReport.bundleFiles.map(file => {
      const bytes = fs.readFileSync(path.join(build.plan.outputDir, file.fileName));
      assert.equal(bytes.length, file.bytes); return { fileName: file.fileName, bytes: bytes.length, sha256: hash(bytes) };
    });
    const report = { schema: 'xtend.rmtx.ssr-runtime-acceptance.v1', format: 1, stage: 'A06.6.2-versioned-rmtx-ssr', node: process.version,
      browser: browser.version(), browserExecutableOverride: true,
      toolchain: Object.fromEntries(['typescript', 'rollup', 'esbuild', 'terser', 'jsdom', 'playwright', 'react', 'react-dom', 'vue']
        .map(name => [name, peers(name + '/package.json').version])),
      passed: true, cases: names.length, names, sources, sourceIdentity: built.sourceIdentity,
      nativeSealedJavaScript: true, trustedServerComposedDocument: true, ssrWireVersion: 3,
      realClassicActionExecutionVerified: true, realKernelFabricVerified: true, results, nativeOnly, files, acceptedForRelease: false };
    const output = process.argv.indexOf('--output');
    if (output >= 0) fs.writeFileSync(path.resolve(process.argv[output + 1]), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ schema: report.schema, passed: true, cases: names.length, node: report.node, browser: report.browser }));
    return report;
  } finally {
    await browser?.close();
    if (server) await new Promise(resolve => server.close(resolve));
    serverFabric?.dispose();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
if (require.main === module) run().catch(error => { console.error(error.stack?.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/gu, 'captured.mjs') || error); process.exitCode = 1; });
module.exports = { run };
