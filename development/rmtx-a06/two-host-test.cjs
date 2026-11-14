'use strict';
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module'), { pathToFileURL } = require('node:url');
const reference = require('./two-host-reference.cjs');
async function run() {
  const peerRoot = process.env.XTENSIONS_TEST_PEERS;
  if (!peerRoot) throw new Error('Set XTENSIONS_TEST_PEERS to the existing external React/Vue/jsdom/Playwright harness.');
  const peers = createRequire(path.resolve(peerRoot, 'package.json')), { lowered, capture } = await reference.prepareCase();
  const browserMode = process.argv.includes('--browser'); let result, browserVersion = null, pageErrors = [];
  if (browserMode) {
    if (!process.env.CHROME_BIN) throw new Error('CHROME_BIN must point to the actual Chromium executable.');
    const providerImports = capture.records.map((record, index) => `import { ${record.definition.entry.exportName} as provider${index} } from 'component-provider:${record.definition.providerId}';`).join('\n');
    const factoryObject = '{' + capture.records.map((record, index) => JSON.stringify(record.definition.providerId) + ':provider' + index).join(',') + '}';
    const bundle = await require('esbuild').build({ plugins: [require('../../tools/xtensions/component-interface-build').capturedComponentPlugin(capture)], stdin: { contents: `
      import React from 'react'; import * as client from 'react-dom/client'; import * as dom from 'react-dom'; import * as Vue from 'vue';
      import {runTwoHostAcceptance} from './two-host-acceptance.mjs';
      import componentInterfaces from '../../tools/xtensions/component-interface.js';
      ${providerImports}
      const providerCatalog=componentInterfaces.createComponentInterfaceCatalog(${JSON.stringify(capture.records)});
      const factories=${factoryObject};
      window.runA06 = () => runTwoHostAcceptance({lowered:window.a06Case, providerCatalog, factories, document, React, ReactDOM:{...client,version:dom.version}, Vue});
    `, resolveDir: __dirname }, nodePaths: [path.resolve(peerRoot, 'node_modules')], bundle: true, platform: 'browser', format: 'iife', write: false,
    define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' } });
    const browser = await peers('playwright').chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
    try {
      browserVersion = browser.version(); const page = await browser.newPage(); page.on('pageerror', error => pageErrors.push(String(error)));
      await page.setContent('<!doctype html><html><body></body></html>');
      await page.evaluate(value => { window.a06Case = value; }, lowered);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      result = await page.evaluate(() => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('A06 browser acceptance timed out.')), 30000);
        window.runA06().then(resolve, reject).finally(() => clearTimeout(timer));
      }));
      if (pageErrors.length) throw new Error(pageErrors.join('\n'));
    } finally { await browser.close(); }
  } else {
    const { JSDOM } = peers('jsdom'), dom = new JSDOM('<!doctype html>', { url: 'http://xtend.test/a06', pretendToBeVisual: true });
    const keys = ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent'];
    const previous = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
    try {
      const { runTwoHostAcceptance } = await import(pathToFileURL(path.join(__dirname, 'two-host-acceptance.mjs')));
      let timer;
      try { result = await Promise.race([runTwoHostAcceptance({ lowered, providerCatalog: capture.catalog, factories: await capture.loadFactories(), document: dom.window.document, React: peers('react'),
        ReactDOM: { ...peers('react-dom/client'), version: peers('react-dom').version }, Vue: peers('vue') }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('A06 jsdom acceptance timed out.')), 30000); })]); }
      finally { clearTimeout(timer); }
    } finally {
      dom.window.close();
      for (const [key, descriptor] of previous) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
  const report = { format: 2, version: '2.0.0', stage: 'A06.1b-provider-component-interface', mode: browserMode ? 'chromium' : 'jsdom', node: process.version,
    versions: { react: peers('react/package.json').version, vue: peers('vue/package.json').version }, browserVersion, pageErrors, ...result,
    automaticCompositionSupported: false, ssrAcceptancePerformed: false, acceptedForRelease: false };
  const index = process.argv.indexOf('--output');
  if (index !== -1) {
    if (!process.argv[index + 1]) throw new Error('--output requires a file.');
    const file = path.resolve(process.argv[index + 1]); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`A06.1b ${report.mode}: ${report.cases} actual React/Vue cases passed (${report.node}).`);
  return report;
}
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { run };
