#!/usr/bin/env node
'use strict';

// Opt-in peers live outside the XTend package/workspaces. See the WP1 contract.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
async function main() {
  const peerRoot = process.env.XTENSIONS_TEST_PEERS;
  if (!peerRoot) throw new Error('Set XTENSIONS_TEST_PEERS to the external test harness directory (with its own package.json).');
  const peers = createRequire(path.resolve(peerRoot, 'package.json'));
  const exportsReport = require('../tests/xtensions/runtime-adapter-exports.cjs').runExportChecks();
  const browser = process.argv.includes('--browser');
  const compiledBindingPlan = require('../development/rmtx-a02/inspect.cjs').inspect();
  const conditionalBindingPlan = require('../development/rmtx-a02/inspect.cjs').inspectConditional();
  const repeatedBindingPlan = require('../development/rmtx-a02/inspect.cjs').inspectRepeated();
  const compilerChecks = require('../tests/xtensions/compiled-state-binding-compiler.cjs').runCompilerChecks();
  const compositionReference = require('../development/rmtx-a04/reference.cjs');
  const compositionPlan = compositionReference.createPlan();
  const compositionTemp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'xtend-a041-runtime-'));
  try {
  const compositionReports = Object.fromEntries(await Promise.all(['react', 'vue'].map(async framework => [framework, await compositionReference.buildReference(compositionPlan, path.join(compositionTemp, framework), framework)])));
  const compositions = Object.fromEntries(await Promise.all(Object.entries(compositionReports).map(async ([framework, report]) => [framework, await import(require('node:url').pathToFileURL(report.entryPath).href)])));
  const integratedDirectories = {}, companionEntries = {};
  for (const key of ['react', 'vue', 'mixed', 'deferred-react', 'deferred-vue', 'deferred-mixed', 'shared-react', 'shared-vue', 'shared-mixed', 'shared-pair-react', 'shared-pair-vue']) {
    const framework = key.replace(/^(?:deferred-|shared-(?:pair-)?)/, '');
    const directory = path.join(compositionTemp, 'integrated-' + key);
    const reference = require('../development/rmtx-a04/integration-reference.cjs');
    const built = await require('../xtend-maraca').buildMaracaBundleAsync(reference[key.startsWith('shared-') ? 'withSharedPeers' : key.startsWith('deferred-') ? 'withDeferredProviders' : 'withProviderGraph'](reference[key.startsWith('shared-pair-') ? 'createSharedPairInput' : 'createBuildInput'](framework, directory, { profile: framework === 'vue' ? 'max' : 'production' })), { rootDir: root });
    if (!built.ok) throw new Error('Integrated build failed: ' + JSON.stringify(built.plan.diagnostics));
    integratedDirectories[key] = directory;
    companionEntries[key] = JSON.parse(fs.readFileSync(path.join(directory, 'xtend.xtensions.report.json'))).artifact.entryFile;
  }
  let report;
  if (browser) {
    const { build } = require('esbuild');
    const { chromium } = peers('playwright');
    const bundle = await build({ stdin: { contents: `
      const {runRuntimeAcceptance} = require('./tests/xtensions/runtime-adapter-acceptance');
      const React = require('react'); const client = require('react-dom/client'); const dom = require('react-dom');
      const Vue = require('vue');
      window.runtimeExports = Object.fromEntries(['react','vue'].map((framework) => {
        const api = framework === 'react' ? require('@ccslabs/xtend/xtensions/react-runtime-adapter') : require('@ccslabs/xtend/xtensions/vue-runtime-adapter');
        return [framework, Object.entries(api).map(([name, value]) => [name, typeof value]).sort()];
      }));
      const compositions = {react: require(${JSON.stringify(compositionReports.react.entryPath)}), vue: require(${JSON.stringify(compositionReports.vue.entryPath)})};
      const compositionPlan = ${JSON.stringify(compositionPlan)};
      const compiledBindingPlan = ${JSON.stringify(compiledBindingPlan)};
      const conditionalBindingPlan = ${JSON.stringify(conditionalBindingPlan)};
      const repeatedBindingPlan = ${JSON.stringify(repeatedBindingPlan)};
      window.__XTendMaracaDisableAutoBoot = true;
      const companionEntries = ${JSON.stringify(companionEntries)};
      window.runAcceptance = async () => {
        const integratedApps = {};
        for (const framework of ['react', 'vue', 'mixed', 'deferred-react', 'deferred-vue', 'deferred-mixed', 'shared-react', 'shared-vue', 'shared-mixed', 'shared-pair-react', 'shared-pair-vue']) {
          const base = 'http://xtend.test/generated/' + framework + '/';
          integratedApps[framework] = { entry: await import(base + 'xtend.maraca.mjs'), platform: (await import(base + 'runtime/xtension-platform.mjs')).default, companion: await import(base + companionEntries[framework]), readProviderRequests: () => window.__readXTensionRequests(framework) };
        }
        return runRuntimeAcceptance({React,ReactDOM:{...client,version:dom.version},Vue,document,compiledBindingPlan,conditionalBindingPlan,repeatedBindingPlan,compositionPlan,compositions,integratedApps}); };`, resolveDir: root },
      nodePaths: [path.resolve(peerRoot, 'node_modules')], bundle: true, platform: 'browser', write: false,
      define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' } });
    const instance = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/chromium', headless: true });
    try {
      const page = await instance.newPage();
      const requests = []; await page.exposeFunction('__readXTensionRequests', key => requests.filter(row => row.startsWith('/generated/' + key + '/providers/')));
      const errors = []; page.on('pageerror', (error) => errors.push(error.message));
      await page.route('http://xtend.test/**', route => {
        const pathname = new URL(route.request().url()).pathname, match = pathname.match(/^\/generated\/((?:deferred-|shared-(?:pair-)?)?(?:react|vue|mixed))\/(.+)$/);
        requests.push(pathname);
        if (match) {
          const directory = integratedDirectories[match[1]], file = path.resolve(directory, match[2]);
          if (!file.startsWith(directory + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'Missing generated asset' });
          return route.fulfill({ contentType: file.endsWith('.json') ? 'application/json' : 'text/javascript', body: fs.readFileSync(file) });
        }
        return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' });
      });
      await page.goto('http://xtend.test/xtensions-test');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      report = await page.evaluate(() => window.runAcceptance());
      const actualExports = await page.evaluate(() => window.runtimeExports);
      require('node:assert/strict').deepEqual(actualExports, exportsReport.runtime, 'actual browser exports match Node and declarations');
      exportsReport.actualBrowserParity = true;
      report.browser = await instance.version(); report.pageErrors = errors;
      if (errors.length) report.ok = false;
    } finally { await instance.close(); }
  } else {
    const { JSDOM } = peers('jsdom');
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true, url: 'http://xtend.test/xtensions-test' });
    for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
    try {
      dom.window.__XTendMaracaDisableAutoBoot = true;
      const integratedApps = {};
      for (const [framework, directory] of Object.entries(integratedDirectories)) integratedApps[framework] = {
        entry: await import(require('node:url').pathToFileURL(path.join(directory, 'xtend.maraca.mjs')).href),
        platform: (await import(require('node:url').pathToFileURL(path.join(directory, 'runtime/xtension-platform.mjs')).href)).default,
      companion: await import(require('node:url').pathToFileURL(path.join(directory, companionEntries[framework])).href)
      };
      report = await require('../tests/xtensions/runtime-adapter-acceptance').runRuntimeAcceptance({ React: peers('react'),
        ReactDOM: { ...peers('react-dom/client'), version: peers('react-dom').version }, Vue: peers('vue'), document: dom.window.document, compiledBindingPlan, conditionalBindingPlan, repeatedBindingPlan, compositionPlan, compositions, integratedApps });
    } finally { dom.window.close(); }
  }
  report = {
    schema: 'xtend.xtensions.runtime-acceptance-report.v2',
    ok: report.ok, passed: report.passed, failed: report.failed,
    versions: report.versions, exports: exportsReport,
    compilerChecks,
    node: process.version, mode: browser ? 'chromium' : 'jsdom',
    browser: report.browser || null, pageErrors: report.pageErrors || []
  };
  const reportIndex = process.argv.indexOf('--report');
  if (reportIndex !== -1) fs.writeFileSync(process.argv[reportIndex + 1], JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.mode} ${report.node}: ${report.passed.length} passed, ${report.failed.length} failed; peers ${JSON.stringify(report.versions)}`);
  for (const failure of report.failed) console.error(failure.name + '\n' + failure.message);
  if (report.pageErrors?.length) console.error(report.pageErrors);
  if (!report.ok) process.exitCode = 1;
  } finally { fs.rmSync(compositionTemp, { recursive: true, force: true }); }
}
const deadline = setTimeout(() => { console.error('Runtime acceptance timed out before producing a complete report.'); process.exit(1); }, 90000);
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(deadline));
