'use strict';
const path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url'), { createRequire } = require('node:module');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const RMTX_FRONTEND_RUNTIME_ACCEPTANCE_SCHEMA = 'xtend.rmtx.frontend-runtime-acceptance.v1';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
async function run() {
  if (!process.env.XTENSIONS_TEST_PEERS) throw Error('XTENSIONS_TEST_PEERS is required.');
  const peerRoot = path.resolve(process.env.XTENSIONS_TEST_PEERS), peers = createRequire(path.join(peerRoot, 'package.json'));
  const sourceFiles = ['development/rmtx-a06/frontend/runtime-test.cjs', 'development/rmtx-a06/frontend/two-host.rmtx',
    'development/rmtx-a06/automatic-reference.cjs', 'development/rmtx-a06/automatic-acceptance.mjs',
    'tools/rmt-language/rmtx-parser.js', 'tools/rmt-language/rmtx-compiler.js', 'tools/rmt-language/classic-compiler.js', 'tools/rmt-language/vnext-compiler.js'];
  const readSources = () => Object.fromEntries(sourceFiles.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
  const sources = readSources();
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-runtime-'));
  const browserMode = process.argv.includes('--browser');
  let dom, browser;
  try {
    const buildDir = path.join(temporary, 'build');
    const compiler = require('../../../tools/rmt-language/rmtx-compiler');
    const sourcePath = path.join(__dirname, 'two-host.rmtx'), sourceText = fs.readFileSync(sourcePath, 'utf8');
    const input = await require('../automatic-reference.cjs').createInput(buildDir);
    input.source = path.relative(root, sourcePath);
    const compiled = compiler.compileRmtxSource({ text: sourceText, filePath: sourcePath }, { xtensionBindings: input.xtensionBindings });
    assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
    const build = await require('../../../xtend-maraca').buildMaracaBundleAsync(input, { rootDir: root, compileSource: compiler.compileRmtxSource });
    assert.equal(build.ok, true, build.status + JSON.stringify(build.plan.diagnostics));
    assert.equal(build.plan.rmt.compilerSchema, compiler.RMTX_COMPILE_RESULT_SCHEMA);
    assert.equal(build.plan.sourceHash, hash(sourceText));
    assert.equal(build.plan.source, path.relative(root, sourcePath).split(path.sep).join('/'));
    assert.equal(compiled.coreDocument.manifest.sourceSyntax, 'rmtx');
    const entryFile = path.basename(build.plan.outputs.entry);
    const composition = JSON.parse(fs.readFileSync(path.join(buildDir, 'xtend.xtensions.report.json'), 'utf8'));
    const artifact = composition.artifact, pageErrors = [];
    let result, browserVersion = null;
    if (browserMode) {
      if (!process.env.CHROME_BIN) throw Error('CHROME_BIN is required.');
      const harness = await peers('esbuild').build({ stdin: {
        contents: `import React from 'react';import * as client from 'react-dom/client';import * as dom from 'react-dom';import * as Vue from 'vue';import {runAutomaticAcceptance} from '../automatic-acceptance.mjs';import fabricApi from '../../../fabric/xtend-fabric.js';import * as kernelModule from '../../../xtendrmt/rmt-kernel-orchestration-controller.js';import * as surfaces from '../../../xtendrmt/rmt-surface-resource-graph-runtime.js';import {xtendState} from '../../../components/xtend-state.js';window.runAutomatic=source=>runAutomaticAcceptance({source,document,React,ReactDOM:{...client,version:dom.version},Vue,createFabric:fabricApi.createXtendFabric,kernelModule,surfaces,state:xtendState});`,
        resolveDir: __dirname }, nodePaths: [path.join(peerRoot, 'node_modules')], bundle: true, platform: 'browser', format: 'iife', write: false,
        define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' }
      });
      const applicationRoot = path.join(temporary, 'application');
      fs.mkdirSync(applicationRoot);
      fs.writeFileSync(path.join(applicationRoot, 'test-harness.js'), harness.outputFiles[0].text);
      const bootstrap = `import './test-harness.js';window.__XTendMaracaDisableAutoBoot=true;const [entry,companion,platform]=await Promise.all([import('./${entryFile}'),import('./${artifact.entryFile}'),import('./runtime/xtension-platform.mjs')]);window.testResult=await window.runAutomatic({entry,companion,platform:platform.default});`;
      fs.writeFileSync(path.join(applicationRoot, 'test-bootstrap.mjs'), bootstrap);
      const deployment = require('../../../xtend-maraca/xtension-composition');
      const sealed = deployment.buildMaracaXTensionDeployment({ schema: 'xtend.maraca.xtension-deployment-config.v1', build,
        application: { rootDir: applicationRoot, bootstrap: { fileName: 'test-bootstrap.mjs', sha256: hash(bootstrap) },
          modules: [{ fileName: 'test-harness.js', sha256: hash(harness.outputFiles[0].text) }] }, publicPath: '/runtime/', outputDir: path.join(temporary, 'public') });
      const handler = deployment.createMaracaXTensionDeploymentHandler(sealed);
      const server = require('node:http').createServer(handler);
      await new Promise(done => server.listen(0, '127.0.0.1', done));
      try {
        browser = await peers('playwright').chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
        browserVersion = browser.version();
        const page = await browser.newPage();
        page.on('pageerror', error => pageErrors.push(String(error)));
        await page.goto('http://127.0.0.1:' + server.address().port + '/runtime/' + sealed.manifest.documentFile);
        await page.waitForFunction(() => window.testResult, { timeout: 30000 });
        result = await page.evaluate(() => window.testResult);
        assert.deepEqual(pageErrors, []);
      } finally { await browser?.close(); await new Promise(done => server.close(done)); }
    } else {
      const { JSDOM } = peers('jsdom');
      dom = new JSDOM('<!doctype html>', { url: 'http://xtend.test/rmtx-frontend', pretendToBeVisual: true });
      for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
      const [entry, companion, platform, { runAutomaticAcceptance }, fabric, kernelModule, surfaces, { xtendState }] = await Promise.all([
        import(pathToFileURL(path.join(buildDir, entryFile))), import(pathToFileURL(path.join(buildDir, artifact.entryFile))),
        import(pathToFileURL(path.join(buildDir, 'runtime/xtension-platform.mjs'))), import('../automatic-acceptance.mjs'),
        import(pathToFileURL(path.join(root, 'fabric/xtend-fabric.js'))), import(pathToFileURL(path.join(root, 'xtendrmt/rmt-kernel-orchestration-controller.js'))),
        import(pathToFileURL(path.join(root, 'xtendrmt/rmt-surface-resource-graph-runtime.js'))), import(pathToFileURL(path.join(root, 'components/xtend-state.js')))
      ]);
      let timer;
      try {
        result = await Promise.race([runAutomaticAcceptance({ source: { entry, companion, platform: platform.default }, document: dom.window.document,
          React: peers('react'), ReactDOM: { ...peers('react-dom/client'), version: peers('react-dom').version }, Vue: peers('vue'),
          createFabric: fabric.default.createXtendFabric, kernelModule, surfaces, state: xtendState }),
          new Promise((_, reject) => { timer = setTimeout(() => reject(Error('RMTX automatic acceptance timed out')), 30000); })]);
      } finally { clearTimeout(timer); }
    }
    assert.equal(result.passed, true);
    assert.equal(result.cases, 8);
    assert.deepEqual(readSources(), sources, 'Productive RMTX sources changed during runtime acceptance.');
    const report = { schema: RMTX_FRONTEND_RUNTIME_ACCEPTANCE_SCHEMA, format: 1, version: '1.0.0', stage: 'A06.2-productive-rmtx-frontend',
      mode: browserMode ? 'chromium-sealed-native-esm' : 'jsdom-native-esm', node: process.version, browserVersion, pageErrors,
      compiler: { schema: compiled.schema, apiVersion: compiled.apiVersion, sourceProfile: compiled.sourceProfile,
        source: build.plan.source, sourceHash: build.plan.sourceHash, planCompilerSchema: build.plan.rmt.compilerSchema },
      versions: { react: peers('react/package.json').version, vue: peers('vue/package.json').version },
      sources, ...result, productiveRmtxFrontendUsed: true, completeRmtxFrontendImplemented: false, acceptedForRelease: false };
    const index = process.argv.indexOf('--output');
    if (index >= 0) fs.writeFileSync(path.resolve(process.argv[index + 1]), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
    return report;
  } finally { dom?.window.close(); fs.rmSync(temporary, { recursive: true, force: true }); }
}
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { RMTX_FRONTEND_RUNTIME_ACCEPTANCE_SCHEMA, run };
