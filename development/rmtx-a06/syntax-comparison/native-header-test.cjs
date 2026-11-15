'use strict';

// Development-only differential execution of independently lowered authoring inputs.
// JSX input is consumed by comparison.cjs, never executed by a JSX factory here.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../../..');
const RUNTIME_EXPERIMENT_VERSION = '1.1.0';

function hashSources() {
  const sources = {};
  const add = file => { sources[path.relative(root, file).replaceAll(path.sep, '/')] = createHash('sha256').update(fs.readFileSync(file)).digest('hex'); };
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && /\.(?:cjs|mjs|tsx|rmtx|rmt|ts)$/.test(file)) add(file);
    }
  };
  walk(__dirname);
  for (const relative of ['development/rmtx-a06/two-host-runtime.mjs', 'development/rmtx-a06/two-host-acceptance.mjs',
    'development/rmtx-a06/two-host-reference.cjs', 'development/rmtx-a06/providers/catalog.json',
    'development/rmtx-a06/providers/react-gallery.mjs', 'development/rmtx-a06/providers/vue-reviews.mjs',
    'xtend-maraca/plan-runtime.mjs', 'xtendrmt/rmt-dom-descriptor-renderer.js', 'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-kernel-scheduler.js', 'xtendrmt/rmt-state-selector-runtime.js', 'xtendrmt/rmt-state-host-adapter.js',
    'xtendrmt/rmt-action-effect-runtime.js', 'xtendrmt/rmt-app-runtime.js', 'xtendrmt/rmt-maraca-view-projection-adapter.js',
    'xtendrmt/rmt-presentation-effect-adapter.js', 'xtendrmt/rmt-event-routing-runtime.js',
    'xtendrmt/rmt-surface-resource-graph-runtime.js', 'components/xsurfacemanager-controller.js', 'components/xtend-state.js',
    'fabric/xtend-fabric.js', 'tools/xtensions/component-interface.js', 'tools/xtensions/component-interface-build.js',
    'tools/xtensions/state-binding.js', 'tools/xtensions/react-runtime-adapter.js', 'tools/xtensions/vue-runtime-adapter.js']) add(path.join(root, relative));
  for (const entry of fs.readdirSync(path.join(__dirname, '../providers'), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isFile() && entry.name.endsWith('.json')) add(path.join(__dirname, '../providers', entry.name));
  }
  return sources;
}

async function run({ browser = false } = {}) {
  const peerRoot = process.env.XTENSIONS_TEST_PEERS;
  if (!peerRoot) throw new Error('Set XTENSIONS_TEST_PEERS to an existing external React/Vue/jsdom/Playwright harness.');
  const peers = createRequire(path.resolve(peerRoot, 'package.json'));
  const variants = await require('./native-header-reference.cjs').prepareNativeHeaderVariants();
  const names = ['declarative', 'hybrid'];
  const initialSources = hashSources();
  let observations, browserVersion = null;
  const pageErrors = [];
  if (browser) {
    if (!process.env.CHROME_BIN) throw new Error('CHROME_BIN must identify an actual Chromium executable.');
    const capture = variants.declarative.capture;
    const providerImports = capture.records.map((record, index) => `import { ${record.definition.entry.exportName} as provider${index} } from 'component-provider:${record.definition.providerId}';`).join('\n');
    const factoryObject = '{' + capture.records.map((record, index) => JSON.stringify(record.definition.providerId) + ':provider' + index).join(',') + '}';
    const bundle = await require('esbuild').build({ plugins: [require('../../../tools/xtensions/component-interface-build').capturedComponentPlugin(capture)], stdin: { contents: `
      import React from 'react'; import * as client from 'react-dom/client'; import * as dom from 'react-dom'; import * as Vue from 'vue';
      import {runNativeHeaderAcceptance as runTwoHostAcceptance} from './native-header-acceptance.mjs';
      import {createTwoHostCase} from '../two-host-runtime.mjs';
      import componentInterfaces from '../../../tools/xtensions/component-interface.js';
      ${providerImports}
      const providerCatalog=componentInterfaces.createComponentInterfaceCatalog(${JSON.stringify(capture.records)});
      const factories=${factoryObject};
      window.runComparison = async () => {
        const results = {};
        for (const name of ['declarative', 'hybrid']) {
          const options = {lowered:window.syntaxVariants[name], providerCatalog, factories, document, React, ReactDOM:{...client,version:dom.version}, Vue};
          results[name] = { acceptance:await runTwoHostAcceptance(options) };
        }
        return results;
      };
    `, resolveDir: __dirname }, nodePaths: [path.resolve(peerRoot, 'node_modules')], bundle: true, platform: 'browser', format: 'iife', write: false,
    define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' } });
    const instance = await peers('playwright').chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
    try {
      browserVersion = instance.version();
      const page = await instance.newPage(); page.on('pageerror', error => pageErrors.push(String(error)));
      await page.setContent('<!doctype html><html><body></body></html>');
      await page.evaluate(value => { window.syntaxVariants = value; }, Object.fromEntries(names.map(name => [name, variants[name].lowered])));
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      observations = await page.evaluate(() => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Syntax comparison browser execution timed out.')), 45000);
        window.runComparison().then(resolve, reject).finally(() => clearTimeout(timer));
      }));
      if (pageErrors.length) throw new Error(pageErrors.join('\n'));
    } finally { await instance.close(); }
  } else {
    const { JSDOM } = peers('jsdom');
    const dom = new JSDOM('<!doctype html>', { url: 'http://xtend.test/a06-syntax-comparison', pretendToBeVisual: true });
    const globals = ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent'];
    const previous = new Map(globals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    for (const key of globals) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
    try {
      const { runNativeHeaderAcceptance: runTwoHostAcceptance } = await import(pathToFileURL(path.join(__dirname, 'native-header-acceptance.mjs')));
      const { createTwoHostCase } = await import(pathToFileURL(path.join(__dirname, '../two-host-runtime.mjs')));
      observations = {};
      for (const name of names) {
        const { lowered, capture } = variants[name];
        const options = { lowered, providerCatalog: capture.catalog, factories: await capture.loadFactories(), document: dom.window.document,
          React: peers('react'), ReactDOM: { ...peers('react-dom/client'), version: peers('react-dom').version }, Vue: peers('vue') };
        let timer;
        try {
          observations[name] = await Promise.race([(async () => ({ acceptance: await runTwoHostAcceptance(options) }))(),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Syntax comparison jsdom execution timed out.')), 45000); })]);
        } finally { clearTimeout(timer); }
      }
    } finally {
      dom.window.close();
      for (const [key, descriptor] of previous) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
  const assert = require('node:assert/strict');
  assert.deepEqual(observations.declarative.acceptance, observations.hybrid.acceptance, 'Both source forms must exhibit the same native header behavior.');
  const sources = hashSources();
  assert.deepEqual(sources, initialSources, 'The runtime evidence must bind one stable source state.');
  return { format: 1, version: RUNTIME_EXPERIMENT_VERSION, stage: 'A06-native-header-acceptance', node: process.version,
    mode: browser ? 'chromium' : 'jsdom-native-frameworks', browserVersion, pageErrors,
    versions: { react: peers('react/package.json').version, vue: peers('vue/package.json').version }, passed: names.every(name=>observations[name].acceptance.passed),
    variants: observations, differentialTraceEqual: true,
    nativeHeaderRuntimeEvaluated: true, ssrAcceptancePerformed: false, productionFrontendImplemented: false, acceptedForRelease: false,
    sourceStableDuringExecution: true, sources };
}

if (require.main === module) run({ browser: process.argv.includes('--browser') }).then(report => {
  const index = process.argv.indexOf('--output');
  if (index !== -1) {
    if (!process.argv[index + 1]) throw new Error('--output requires a file.');
    const file = path.resolve(process.argv[index + 1]); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  }
  if (!report.passed) process.exitCode = 1;
  console.log(JSON.stringify({ passed: report.passed, mode: report.mode, node: report.node,
    acceptanceCasesPerVariant: report.variants.declarative.acceptance.cases, passedCasesPerVariant: report.variants.declarative.acceptance.passedCases, failedCasesPerVariant: report.variants.declarative.acceptance.failedCases, differentialTraceEqual: report.differentialTraceEqual }));
}).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { RUNTIME_EXPERIMENT_VERSION, run };
