'use strict';
const path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url'), { createRequire } = require('node:module');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const RMTX_NATIVE_VIEW_RUNTIME_ACCEPTANCE_SCHEMA = 'xtend.rmtx.native-view-runtime-acceptance.v1';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
async function run() {
  if (!process.env.XTENSIONS_TEST_PEERS) throw Error('XTENSIONS_TEST_PEERS is required.');
  const peerRoot = path.resolve(process.env.XTENSIONS_TEST_PEERS), peers = createRequire(path.join(peerRoot, 'package.json'));
  const { sourceFiles } = require('./inspect.cjs');
  const readSources = () => Object.fromEntries(sourceFiles.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
  const sources = readSources();
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-native-view-runtime-'));
  const browserMode = process.argv.includes('--browser');
  let dom, browser;
  try {
    const buildDir = path.join(temporary, 'build');
    const compiler = require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({ syntaxVersion: '5.0.0' });
    const sourcePath = path.join(__dirname, 'source.rmtx'), sourceText = fs.readFileSync(sourcePath, 'utf8');
    const input = await require('./reference.cjs').createInput(buildDir);
    input.source = path.relative(root, sourcePath);
    const compiled = compiler.compileSource({ text: sourceText, filePath: sourcePath }, { componentInterfaceCatalog: require('./reference.cjs').catalog() });
    assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
    assert.equal(compiled.parserResult.hostScopes.schema, 'xtend.rmtx.host-scopes.v3');
    assert.equal(compiled.parserResult.hostScopes.hosts.length, 2);
    assert.equal(input.xtensionBindings, undefined); assert.equal(input.xtensionComposition, undefined);
    assert.equal(compiled.xtensionComposition.schema, 'xtend.maraca.xtension-composition-manifest.v9');
    assert(compiled.xtensionBindings.bindings.every(entry => entry.repeat.length === 2 && entry.presence));
    const compileChecks = require('./reference.cjs').verifyCompileCases();

    const build = await require('../../../xtend-maraca').buildMaracaBundleAsync(input, { rootDir: root, compileSource: compiler.compileSource });
    assert.equal(build.ok, true, build.status + JSON.stringify(build.plan.diagnostics));
    assert.equal(compiled.schema, 'xtend.rmtx.compile-result.v5');
    assert.equal(compiled.sourceProfile.version, '5.0.0');
    assert.equal(build.plan.rmt.compilerSchema, compiled.schema);
    assert.equal(build.plan.sourceHash, hash(sourceText));
    assert.equal(build.plan.source, path.relative(root, sourcePath).split(path.sep).join('/'));
    assert.equal(compiled.coreDocument.manifest.sourceSyntax, 'rmtx');
    const entryFile = path.basename(build.plan.outputs.entry);
    const composition = JSON.parse(fs.readFileSync(path.join(buildDir, 'xtend.xtensions.report.json'), 'utf8'));
    const artifact = composition.artifact, pageErrors = [];
    const nativeBuildDir = path.join(temporary, 'native-only-build');
    const nativeBuild = await require('./reference.cjs').build(nativeBuildDir, true);
    assert.equal(nativeBuild.ok, true, nativeBuild.status + JSON.stringify(nativeBuild.plan.diagnostics));
    assert.equal(nativeBuild.plan.schema, 'xtend.maraca.build-plan.v9');
    assert.equal(nativeBuild.plan.xtensionComposition, undefined);
    const nativeEntryFile = path.basename(nativeBuild.plan.outputs.entry);
    let result, browserVersion = null;
    if (browserMode) {
      if (!process.env.CHROME_BIN) throw Error('CHROME_BIN is required.');
      const harness = await peers('esbuild').build({ stdin: {
        contents: `import React from 'react';import * as client from 'react-dom/client';import * as dom from 'react-dom';import * as Vue from 'vue';import {runKeyedRuntimeAcceptance} from './runtime-acceptance.mjs';import fabricApi from '../../../fabric/xtend-fabric.js';import * as kernelModule from '../../../xtendrmt/rmt-kernel-orchestration-controller.js';import * as surfaces from '../../../xtendrmt/rmt-surface-resource-graph-runtime.js';import {xtendState} from '../../../components/xtend-state.js';import urlState from '../../../tools/xtensions/url-state.js';import {createXRouterNativeURLStateHost} from '../../../components/xrouter-url-state.js';window.runKeyedAcceptance=source=>runKeyedRuntimeAcceptance({source,document,React,ReactDOM:{...client,version:dom.version},Vue,createFabric:fabricApi.createXtendFabric,kernelModule,surfaces,state:xtendState,urlStateRuntime:urlState.NATIVE_URL_STATE_RUNTIME,createURLStateHost:createXRouterNativeURLStateHost});`,
        resolveDir: __dirname }, nodePaths: [path.join(peerRoot, 'node_modules')], bundle: true, platform: 'browser', format: 'iife', write: false,
        define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' }
      });
      const applicationRoot = path.join(temporary, 'application');
      fs.mkdirSync(applicationRoot);
      fs.writeFileSync(path.join(applicationRoot, 'test-harness.js'), harness.outputFiles[0].text);
      // Native-only output remains an independently regular-built application.
      // Copy its actual ESM closure into the sealed application's module set.
      const nativeModules = [];
      function copyNative(directory, relative = '') {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const child = path.join(directory, entry.name), name = path.posix.join(relative, entry.name);
          if (entry.isDirectory()) { copyNative(child, name); continue; }
          if (!/\.m?js$/u.test(entry.name)) continue;
          const bytes = fs.readFileSync(child), fileName = 'native-only/' + name, target = path.join(applicationRoot, fileName);
          fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
          nativeModules.push({ fileName, sha256: hash(bytes) });
        }
      }
      copyNative(nativeBuildDir);
      // A byte-identical second entry URL gives autoboot its own module
      // evaluation while retaining the sealed graph's query-free imports.
      const autoFile = 'native-only/xtend-native-autoboot.mjs', autoBytes = fs.readFileSync(path.join(nativeBuildDir, nativeEntryFile));
      assert(!fs.existsSync(path.join(applicationRoot, autoFile)));
      fs.writeFileSync(path.join(applicationRoot, autoFile), autoBytes);
      nativeModules.push({ fileName: autoFile, sha256: hash(autoBytes) });
      const bootstrap = `import './test-harness.js';window.__XTendMaracaDisableAutoBoot=true;const [entry,companion,platform,nativeEntry]=await Promise.all([import('./${entryFile}'),import('./${artifact.entryFile}'),import('./runtime/xtension-platform.mjs'),import('./native-only/${nativeEntryFile}')]);window.testResult=await window.runKeyedAcceptance({entry,companion,platform:platform.default,nativeEntry,loadNativeAutoBoot:()=>import('./${autoFile}')});`;
      fs.writeFileSync(path.join(applicationRoot, 'test-bootstrap.mjs'), bootstrap);
      const deployment = require('../../../xtend-maraca/xtension-composition');
      const sealed = deployment.buildMaracaXTensionDeployment({ schema: 'xtend.maraca.xtension-deployment-config.v1', build,
        application: { rootDir: applicationRoot, bootstrap: { fileName: 'test-bootstrap.mjs', sha256: hash(bootstrap) },
          modules: [{ fileName: 'test-harness.js', sha256: hash(harness.outputFiles[0].text) }, ...nativeModules] }, publicPath: '/runtime/', outputDir: path.join(temporary, 'public') });
      const handler = deployment.createMaracaXTensionDeploymentHandler(sealed);
      const server = require('node:http').createServer(handler);
      await new Promise(done => server.listen(0, '127.0.0.1', done));
      try {
        browser = await peers('playwright').chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
        browserVersion = browser.version();
        const page = await browser.newPage();
        page.on('pageerror', error => pageErrors.push(String(error)));
        await page.goto('http://127.0.0.1:' + server.address().port + '/runtime/' + sealed.manifest.documentFile);
        await page.waitForFunction(() => window.testResult, { timeout: 90000 });
        result = await page.evaluate(() => window.testResult);
        assert.deepEqual(pageErrors, []);
      } finally { await browser?.close(); await new Promise(done => server.close(done)); }
    } else {
      const { JSDOM } = peers('jsdom');
      dom = new JSDOM('<!doctype html>', { url: 'http://xtend.test/rmtx-keyed', pretendToBeVisual: true });
      for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
      dom.window.__XTendMaracaDisableAutoBoot = true;
      const [entry, companion, platform, { runKeyedRuntimeAcceptance }, fabric, kernelModule, surfaces, { xtendState }, nativeEntry] = await Promise.all([
        import(pathToFileURL(path.join(buildDir, entryFile))), import(pathToFileURL(path.join(buildDir, artifact.entryFile))),
        import(pathToFileURL(path.join(buildDir, 'runtime/xtension-platform.mjs'))), import('./runtime-acceptance.mjs'),
        import(pathToFileURL(path.join(root, 'fabric/xtend-fabric.js'))), import(pathToFileURL(path.join(root, 'xtendrmt/rmt-kernel-orchestration-controller.js'))),
        import(pathToFileURL(path.join(root, 'xtendrmt/rmt-surface-resource-graph-runtime.js'))), import(pathToFileURL(path.join(root, 'components/xtend-state.js'))),
        import(pathToFileURL(path.join(nativeBuildDir, nativeEntryFile)))
      ]);
      let timer;
      try {
        result = await Promise.race([runKeyedRuntimeAcceptance({ source: { entry, companion, platform: platform.default, nativeEntry,
          loadNativeAutoBoot: () => import(pathToFileURL(path.join(nativeBuildDir, nativeEntryFile)).href + '?native-autoboot=1') }, document: dom.window.document,
          React: peers('react'), ReactDOM: { ...peers('react-dom/client'), version: peers('react-dom').version }, Vue: peers('vue'),
          urlStateRuntime: require('../../../tools/xtensions/url-state').NATIVE_URL_STATE_RUNTIME,
          createURLStateHost: (await import('../../../components/xrouter-url-state.js')).createXRouterNativeURLStateHost,
          createFabric: fabric.default.createXtendFabric, kernelModule, surfaces, state: xtendState }),
          new Promise((_, reject) => { timer = setTimeout(() => reject(Error('RMTX native acceptance timed out')), 90000); })]);
      } finally { clearTimeout(timer); }
    }
    assert.equal(result.passed, true);
    assert.equal(result.cases, 20);
    assert.equal(result.sourceHostScopesVerified, true);
    assert.equal(compileChecks.checks, 12);
    for (const flag of ['productiveNativeViewVerified', 'nativeDOMIdentityVerified', 'nativePreflightVerified', 'nativeOnlyKernelFabricVerified', 'nativeURLStateVerified', 'xrouterNativeURLStateVerified']) assert.equal(result[flag], true, flag);
    assert.deepEqual(readSources(), sources, 'Productive RMTX sources changed during runtime acceptance.');
    const report = { schema: RMTX_NATIVE_VIEW_RUNTIME_ACCEPTANCE_SCHEMA, format: 1, version: '1.0.0', stage: 'A06.4.1-native-view-runtime',
      mode: browserMode ? 'chromium-sealed-native-esm' : 'jsdom-native-esm', node: process.version, browserVersion, pageErrors,
      compiler: { schema: compiled.schema, apiVersion: compiled.apiVersion, sourceProfile: compiled.sourceProfile,
        source: build.plan.source, sourceHash: build.plan.sourceHash, planCompilerSchema: build.plan.rmt.compilerSchema, hostScopesSchema: compiled.parserResult.hostScopes.schema },
      compileChecks,
      versions: { react: peers('react/package.json').version, vue: peers('vue/package.json').version },
      sources, ...result, productiveRmtxFrontendUsed: true, completeA063Implemented: true, nativeHtmlViewImplemented: true, completeA064Implemented: false, completeRmtxFrontendImplemented: false, acceptedForRelease: false };
    const index = process.argv.indexOf('--output');
    if (index >= 0) fs.writeFileSync(path.resolve(process.argv[index + 1]), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
    return report;
  } finally { dom?.window.close(); fs.rmSync(temporary, { recursive: true, force: true }); }
}
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { RMTX_NATIVE_VIEW_RUNTIME_ACCEPTANCE_SCHEMA, run };
