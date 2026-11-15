'use strict';

// Development-only differential execution of independently lowered authoring inputs.
// JSX input is consumed by comparison.cjs, never executed by a JSX factory here.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../../..');
const RUNTIME_EXPERIMENT_VERSION = '1.0.0';

// Keep this function independent of Node APIs so the identical trace runs in Chromium.
async function observeTrace(options, createTwoHostCase) {
  const fixture = createTwoHostCase(options), trace = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const same = (left, right, message) => assert(JSON.stringify(left) === JSON.stringify(right), message);
  const rootId = 'a06-product-details';
  const product = () => JSON.parse(JSON.stringify(fixture.runtime.model.getState('product')));
  const record = (phase, extra = {}) => {
    trace.push({ phase, product: product(), projected: JSON.parse(JSON.stringify(fixture.state.getPath('product'))),
      controls: [...fixture.root.querySelectorAll('select')].map(node => node.value),
      outputs: [...fixture.root.querySelectorAll('output')].map(node => node.textContent),
      resources: fixture.kernel.listResources(rootId).length,
      commands: fixture.commands.map(row => ({ ...row })), ...extra });
  };
  try {
    await fixture.runtime.boot(); await fixture.idle();
    assert(fixture.hosts.length === 2, 'Both authoring variants must create two real framework roots.');
    const gallery = fixture.latest('product-gallery'), reviews = fixture.latest('product-reviews');
    const galleryNode = gallery.context.container.querySelector('select');
    const reviewsNode = reviews.context.container.querySelector('select');
    assert(galleryNode && reviewsNode && galleryNode !== reviewsNode, 'Distinct native React/Vue controls required.');
    assert(fixture.kernel.listResources(rootId).length === 2, 'Both provider resources must belong to the native Kernel.');
    const laneAdmissions = fixture.hosts.map(entry => ({ declarationId: entry.definition.declarationId, lane: entry.definition.lane,
      kernelFabricAdmission: fixture.fabric.getFibers().some(fiber => fiber.phase === 'mount' && fiber.lane === entry.definition.lane && fiber.metadata?.kernelJobId) }));
    assert(laneAdmissions.every(row => row.kernelFabricAdmission), 'Provider mounting must pass Kernel/Fabric admission.');
    record('initial', { laneAdmissions });

    galleryNode.value = 'back';
    galleryNode.dispatchEvent(new options.document.defaultView.Event('change', { bubbles: true }));
    await fixture.idle();
    assert(product().selectedImageId === 'back', 'React DOM intent must reach the declared Model Action.');
    assert(reviews.context.container.querySelector('select') === reviewsNode, 'React update must preserve the Vue root.');
    reviewsNode.value = 'rating';
    reviewsNode.dispatchEvent(new options.document.defaultView.Event('change', { bubbles: true }));
    await fixture.idle();
    assert(product().reviewsSort === 'rating', 'Vue DOM intent must map provider order to the Action sort input.');
    assert(gallery.context.container.querySelector('select') === galleryNode, 'Vue update must preserve the React root.');
    record('provider-dom-events', { siblingRootsPreserved: true });

    fixture.graph.closeSurface(options.lowered.ownerSurface); await fixture.idle();
    assert(fixture.hosts.every(entry => entry.host.snapshot().suspended), 'Shared owner must suspend both providers.');
    await fixture.runtime.dispatchCommand('product.selectImage', { imageId: 'front' });
    await fixture.runtime.dispatchCommand('product.changeSort', { sort: 'recent' }); await fixture.idle();
    same([galleryNode.value, reviewsNode.value], ['back', 'rating'], 'Closed owner must stage controlled projection.');
    record('closed-owner-stages-model', { allSuspended: true });
    await fixture.graph.openSurface(options.lowered.ownerSurface); await fixture.idle();
    same([galleryNode.value, reviewsNode.value], ['front', 'recent'], 'Resumed owner must deliver the latest Model.');
    assert(gallery.context.container.querySelector('select') === galleryNode && reviews.context.container.querySelector('select') === reviewsNode,
      'Resume must preserve both native roots.');
    record('resumed-owner', { nativeRootsPreserved: true });

    await fixture.runtime.dispatchCommand('hosts.replace', { hosts: { gallery: false, reviews: true } }); await fixture.idle();
    assert(gallery.host.snapshot().disposed, 'Removal must terminate the old gallery lifetime.');
    assert(fixture.kernel.listResources(rootId).length === 1, 'Removal must release only the removed host lease.');
    assert(reviews.context.container.querySelector('select') === reviewsNode, 'Removal must retain the sibling root.');
    record('gallery-removed', { retiredDisposed: true, siblingRootPreserved: true });
    await fixture.runtime.dispatchCommand('hosts.replace', { hosts: { gallery: true, reviews: true } }); await fixture.idle();
    const fresh = fixture.latest('product-gallery');
    same(fresh.context.identity.address, gallery.context.identity.address, 'Recreated host retains its logical address.');
    assert(fresh.context.identity.incarnation !== gallery.context.identity.incarnation, 'Recreated host needs a fresh incarnation.');
    const before = product();
    const retiredAccepted = gallery.context.onEvent({ ok: true, direction: 'upstream', event: 'selectImage',
      payloadSchema: gallery.context.events.selectImage, payload: { imageId: 'back' }, source: gallery.context });
    assert(retiredAccepted === false, 'The retired provider callback must be fenced.');
    same(product(), before, 'A retired provider intent cannot update its replacement.');
    record('gallery-recreated', { logicalAddressRetained: true, freshIncarnation: true, retiredCallbackAccepted: false });

    fixture.graph.destroySurface(options.lowered.ownerSurface); await fixture.idle();
    assert(fixture.kernel.listResources(rootId).length === 0, 'Owner destruction must revoke all native leases.');
    assert(fixture.root.querySelectorAll('select').length === 0, 'Owner destruction must unmount both real framework roots.');
    assert(fixture.hosts.every(entry => entry.host.snapshot().disposed), 'All host lifetimes must be terminal.');
    record('owner-destroyed', { allDisposed: true });
    return trace;
  } finally { await fixture.close(); }
}

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
  const variants = await require('./comparison.cjs').prepareVariants();
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
      import {runTwoHostAcceptance} from '../two-host-acceptance.mjs';
      import {createTwoHostCase} from '../two-host-runtime.mjs';
      import componentInterfaces from '../../../tools/xtensions/component-interface.js';
      ${providerImports}
      const providerCatalog=componentInterfaces.createComponentInterfaceCatalog(${JSON.stringify(capture.records)});
      const factories=${factoryObject};
      const observeTrace=${observeTrace.toString()};
      window.runComparison = async () => {
        const results = {};
        for (const name of ['declarative', 'hybrid']) {
          const options = {lowered:window.syntaxVariants[name], providerCatalog, factories, document, React, ReactDOM:{...client,version:dom.version}, Vue};
          results[name] = { acceptance:await runTwoHostAcceptance(options), trace:await observeTrace(options, createTwoHostCase) };
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
      const { runTwoHostAcceptance } = await import(pathToFileURL(path.join(__dirname, '../two-host-acceptance.mjs')));
      const { createTwoHostCase } = await import(pathToFileURL(path.join(__dirname, '../two-host-runtime.mjs')));
      observations = {};
      for (const name of names) {
        const { lowered, capture } = variants[name];
        const options = { lowered, providerCatalog: capture.catalog, factories: await capture.loadFactories(), document: dom.window.document,
          React: peers('react'), ReactDOM: { ...peers('react-dom/client'), version: peers('react-dom').version }, Vue: peers('vue') };
        let timer;
        try {
          observations[name] = await Promise.race([(async () => ({ acceptance: await runTwoHostAcceptance(options), trace: await observeTrace(options, createTwoHostCase) }))(),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Syntax comparison jsdom execution timed out.')), 45000); })]);
        } finally { clearTimeout(timer); }
      }
    } finally {
      dom.window.close();
      for (const [key, descriptor] of previous) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
  const assert = require('node:assert/strict');
  for (const name of names) assert.equal(observations[name].acceptance.passed, true);
  assert.deepEqual(observations.declarative.trace, observations.hybrid.trace, 'Independent authoring inputs must yield the same actual Model/DOM/Kernel/Fabric trace.');
  const sources = hashSources();
  assert.deepEqual(sources, initialSources, 'The runtime evidence must bind one stable source state.');
  return { format: 1, version: RUNTIME_EXPERIMENT_VERSION, stage: 'A06-two-host-syntax-comparison', node: process.version,
    mode: browser ? 'chromium' : 'jsdom-native-frameworks', browserVersion, pageErrors,
    versions: { react: peers('react/package.json').version, vue: peers('vue/package.json').version }, passed: true,
    variants: observations, differentialTraceEqual: true, differentialStages: observations.declarative.trace.length,
    nativeHeaderRuntimeEvaluated: false, ssrAcceptancePerformed: false, productionFrontendImplemented: false, acceptedForRelease: false,
    sourceStableDuringExecution: true, sources };
}

if (require.main === module) run({ browser: process.argv.includes('--browser') }).then(report => {
  const index = process.argv.indexOf('--output');
  if (index !== -1) {
    if (!process.argv[index + 1]) throw new Error('--output requires a file.');
    const file = path.resolve(process.argv[index + 1]); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify({ passed: report.passed, mode: report.mode, node: report.node,
    acceptanceCasesPerVariant: report.variants.declarative.acceptance.cases, differentialStages: report.differentialStages, differentialTraceEqual: report.differentialTraceEqual }));
}).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { RUNTIME_EXPERIMENT_VERSION, observeTrace, run };
