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
      window.runAcceptance = () => runRuntimeAcceptance({React,ReactDOM:{...client,version:dom.version},Vue,document});`, resolveDir: root },
      nodePaths: [path.resolve(peerRoot, 'node_modules')], bundle: true, platform: 'browser', write: false,
      define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' } });
    const instance = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/chromium', headless: true });
    try {
      const page = await instance.newPage();
      const errors = []; page.on('pageerror', (error) => errors.push(error.message));
      await page.setContent('<!doctype html><html><body></body></html>');
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
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
    for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
    try {
      report = await require('../tests/xtensions/runtime-adapter-acceptance').runRuntimeAcceptance({ React: peers('react'),
        ReactDOM: { ...peers('react-dom/client'), version: peers('react-dom').version }, Vue: peers('vue'), document: dom.window.document });
    } finally { dom.window.close(); }
  }
  report = {
    schema: 'xtend.xtensions.runtime-acceptance-report.v1',
    ok: report.ok, passed: report.passed, failed: report.failed,
    versions: report.versions, exports: exportsReport,
    node: process.version, mode: browser ? 'chromium' : 'jsdom',
    browser: report.browser || null, pageErrors: report.pageErrors || []
  };
  const reportIndex = process.argv.indexOf('--report');
  if (reportIndex !== -1) fs.writeFileSync(process.argv[reportIndex + 1], JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.mode} ${report.node}: ${report.passed.length} passed, ${report.failed.length} failed; peers ${JSON.stringify(report.versions)}`);
  for (const failure of report.failed) console.error(failure.name + '\n' + failure.message);
  if (report.pageErrors?.length) console.error(report.pageErrors);
  if (!report.ok) process.exitCode = 1;
}
const deadline = setTimeout(() => { console.error('Runtime acceptance timed out before producing a complete report.'); process.exit(1); }, 60000);
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(deadline));
