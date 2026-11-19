'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { createRequire } = require('node:module'), { pathToFileURL } = require('node:url'), { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../../..'), hash = value => createHash('sha256').update(value).digest('hex');
const RMTX_NATIVE_ORCHESTRATION_RUNTIME_ACCEPTANCE_SCHEMA = 'xtend.rmtx.native-orchestration-runtime-acceptance.v1';
async function run() {
  if (!process.env.XTENSIONS_TEST_PEERS) throw Error('XTENSIONS_TEST_PEERS is required.');
  const peerRoot = path.resolve(process.env.XTENSIONS_TEST_PEERS), peers = createRequire(path.join(peerRoot, 'package.json'));
  const browserMode = process.argv.includes('--browser'), temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-orchestration-'));
  const reference = require('./reference.cjs'), pageErrors = [], saved = new Map(); let dom, browser;
  const readSources = () => Object.fromEntries(require('./inspect.cjs').sourceFiles.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
  const sources = readSources();
  try {
    const buildDir = path.join(temporary, 'mixed'), build = await reference.build(buildDir);
    assert.equal(build.ok, true, build.status + JSON.stringify(build.plan.diagnostics));
    assert.equal(build.plan.schema, 'xtend.maraca.build-plan.v11'); assert.equal(build.plan.rmt.compilerSchema, 'xtend.rmtx.compile-result.v7');
    const compiled = reference.compiler().compileSource({ text: fs.readFileSync(path.join(root, reference.source), 'utf8'), filePath: reference.source }, { componentInterfaceCatalog: reference.catalog() });
    assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
    const artifact = JSON.parse(fs.readFileSync(path.join(buildDir, 'xtend.xtensions.report.json'))).artifact;
    assert.equal(artifact.schema, 'xtend.maraca.xtension-composition-artifact.v12');
    const entryFile = path.basename(build.plan.outputs.entry);
    let result, browserVersion = null;
    if (browserMode) {
      if (!process.env.CHROME_BIN) throw Error('CHROME_BIN is required.');
      const harness = await peers('esbuild').build({ stdin: { contents: `import React from 'react';import * as client from 'react-dom/client';import * as dom from 'react-dom';import * as Vue from 'vue';import {runOrchestratedRuntimeAcceptance} from './runtime-acceptance.mjs';import fabricApi from '../../../fabric/xtend-fabric.js';import * as kernelModule from '../../../xtendrmt/rmt-kernel-orchestration-controller.js';import * as surfaces from '../../../xtendrmt/rmt-surface-resource-graph-runtime.js';import {xtendState} from '../../../components/xtend-state.js';window.runOrchestratedAcceptance=source=>runOrchestratedRuntimeAcceptance({source,document,React,ReactDOM:{...client,version:dom.version},Vue,createFabric:fabricApi.createXtendFabric,kernelModule,surfaces,state:xtendState});`, resolveDir: __dirname },
        nodePaths: [path.join(peerRoot, 'node_modules')], bundle: true, platform: 'browser', format: 'iife', write: false,
        define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' } });
      const applicationRoot = path.join(temporary, 'application'); fs.mkdirSync(applicationRoot);
      fs.writeFileSync(path.join(applicationRoot, 'test-harness.js'), harness.outputFiles[0].text);
      const bootstrap = `import './test-harness.js';window.__XTendMaracaDisableAutoBoot=true;const [entry,companion,platform]=await Promise.all([import('./${entryFile}'),import('./${artifact.entryFile}'),import('./runtime/xtension-platform.mjs')]);window.testResult=await window.runOrchestratedAcceptance({entry,companion,platform:platform.default});`;
      fs.writeFileSync(path.join(applicationRoot, 'test-bootstrap.mjs'), bootstrap);
      const deployment = require('../../../xtend-maraca/xtension-composition');
      const sealed = deployment.buildMaracaXTensionDeployment({ schema: 'xtend.maraca.xtension-deployment-config.v1', build,
        application: { rootDir: applicationRoot, bootstrap: { fileName: 'test-bootstrap.mjs', sha256: hash(bootstrap) }, modules: [{ fileName: 'test-harness.js', sha256: hash(harness.outputFiles[0].text) }] },
        publicPath: '/runtime/', outputDir: path.join(temporary, 'public') });
      const server = require('node:http').createServer(deployment.createMaracaXTensionDeploymentHandler(sealed));
      await new Promise(done => server.listen(0, '127.0.0.1', done));
      try {
        browser = await peers('playwright').chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
        browserVersion = browser.version(); const page = await browser.newPage(); page.on('pageerror', error => pageErrors.push(String(error)));
        await page.goto('http://127.0.0.1:' + server.address().port + '/runtime/' + sealed.manifest.documentFile);
        await page.waitForFunction(() => window.testResult, { timeout: 90000 }); result = await page.evaluate(() => window.testResult);
        assert.deepEqual(pageErrors, []);
      } finally { await browser?.close(); await new Promise(done => server.close(done)); }
    } else {
      dom = new (peers('jsdom').JSDOM)('<!doctype html>', { url: 'http://xtend.test/rmtx-lifecycle', pretendToBeVisual: true });
      for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent', 'customElements', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
        saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value: ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(key) ? dom.window[key].bind(dom.window) : dom.window[key] });
      }
      dom.window.matchMedia ||= () => ({matches:false,addEventListener(){},removeEventListener(){}});
      dom.window.__XTendMaracaDisableAutoBoot = true;
      const [entry, companion, platform, acceptance, fabric, kernelModule, surfaces, { xtendState }, nativeEntry] = await Promise.all([
        import(pathToFileURL(path.join(buildDir, entryFile))), import(pathToFileURL(path.join(buildDir, artifact.entryFile))), import(pathToFileURL(path.join(buildDir, 'runtime/xtension-platform.mjs'))),
        import('./runtime-acceptance.mjs'), import(pathToFileURL(path.join(root, 'fabric/xtend-fabric.js'))), import(pathToFileURL(path.join(root, 'xtendrmt/rmt-kernel-orchestration-controller.js'))),
        import(pathToFileURL(path.join(root, 'xtendrmt/rmt-surface-resource-graph-runtime.js'))), import(pathToFileURL(path.join(root, 'components/xtend-state.js')))
        ]);
      result = await acceptance.runOrchestratedRuntimeAcceptance({ source: { entry, companion, platform: platform.default }, document: dom.window.document,
        React: peers('react'), ReactDOM: { ...peers('react-dom/client'), version: peers('react-dom').version }, Vue: peers('vue'),
        createFabric: fabric.default.createXtendFabric, kernelModule, surfaces, state: xtendState });
    }
    assert.equal(result.passed, true); assert(result.cases >= 8);
    const compileChecks = reference.verifyCompileCases(); assert.equal(compileChecks.checks,10);
    assert.deepEqual(readSources(), sources, 'Productive Source7 files changed during runtime acceptance.');
    const report = { schema: RMTX_NATIVE_ORCHESTRATION_RUNTIME_ACCEPTANCE_SCHEMA, format: 1, version: '1.0.0', stage: 'A06.4.2-native-orchestration',
      mode: browserMode ? 'chromium-sealed-native-esm' : 'jsdom-native-esm', node: process.version, browserVersion, pageErrors,
      compiler: { schema: compiled.schema, sourceProfile: compiled.sourceProfile, viewProfile: compiled.parserResult.viewProfile, actionProfile: compiled.parserResult.actionProfile,
        lifecyclePlan: compiled.orchestrationArtifacts.lifecycle.schema, programSchema: compiled.orchestrationArtifacts.schema,
        buildPlanSchema: build.plan.schema, compositionArtifactSchema: artifact.schema, source: build.plan.source, sourceHash: build.plan.sourceHash },
      compileChecks, sources, versions: { react: peers('react/package.json').version, vue: peers('vue/package.json').version },
      ...result, nativeOnlyBuildVerified: false, productiveRmtxFrontendUsed: true, completeA064Implemented: false, ssrAcceptancePerformed: false, acceptedForRelease: false };
    const index = process.argv.indexOf('--output'); if (index >= 0) fs.writeFileSync(path.resolve(process.argv[index + 1]), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report)); return report;
  } finally {
    dom?.window.close(); for (const [key, value] of saved) { if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key]; }
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { RMTX_NATIVE_ORCHESTRATION_RUNTIME_ACCEPTANCE_SCHEMA, run };
