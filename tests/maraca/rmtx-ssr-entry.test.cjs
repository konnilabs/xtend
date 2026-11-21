'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const load = file => import(pathToFileURL(path.join(root, file)).href);
const identity = () => ({schema:'xtend.maraca.rmtx-ssr-source-identity.v1',sourceProfile:{syntax:'rmtx',version:'5.0.0'},sourceHash:'a'.repeat(64),project:{schema:'xtend.rmt.project-report.v1',apiVersion:'1.0.0',identity:'b'.repeat(64),sourceSyntax:'rmtx'}});
const config = () => ({schema:'xtend.maraca.browser-composition-root.v11',buildPlanSchema:'xtend.maraca.build-plan.v9',sourceHash:'a'.repeat(64),orchestration:{enabled:true,artifact:{schema:'xtend.rmt.app-orchestration.v3'}}});

test('SSR builder rejects missing, unknown or widened request versions before compiling', async () => {
  const { buildMaracaRmtxSSRBundleAsync, MARACA_RMTX_SSR_BUILD_API_VERSION } = require('../../xtend-maraca');
  assert.equal(MARACA_RMTX_SSR_BUILD_API_VERSION, '1.0.0');
  for (const request of [null, {}, {schema:'xtend.maraca.rmtx-ssr-build-options.v2',input:{}}, {schema:'xtend.maraca.rmtx-ssr-build-options.v1',input:{},enableAnything:true}]) {
    const result = await buildMaracaRmtxSSRBundleAsync(request);
    assert.equal(result.schema, 'xtend.maraca.rmtx-ssr-build-result.v1');
    assert.equal(result.ok, false);
    assert.equal(result.build, null);
    assert.equal(result.sourceIdentity, null);
    assert.equal(result.diagnostics[0].code, 'xtend.maraca.rmtx_ssr_build.invalid');
  }
});

test('retained browser entry rejects SSRv3 and direct adoption before host work', async () => {
  const { createMaracaBrowserCompositionRoot } = await load('xtend-maraca/browser-composition-runtime.mjs');
  const app = createMaracaBrowserCompositionRoot(config());
  for (const options of [{xtensions:{ssr:{schema:'xtend.maraca.xtension-ssr-options.v3'}}},{adoptExisting:true},{ssrResponse:{}}]) {
    await assert.rejects(app.boot(options), /no SSR\/adoption acceptance contract/);
  }
});

test('explicit browser wrapper and v3 options cannot be substituted by old wire or caller adoption', async () => {
  const { createMaracaRmtxSSRCompositionRoot } = await load('xtend-maraca/browser-composition-runtime.mjs');
  const wrapper = () => ({schema:'xtend.maraca.rmtx-ssr-browser-root.v1',configuration:config(),sourceIdentity:identity()});
  assert.throws(() => createMaracaRmtxSSRCompositionRoot({...wrapper(),schema:'xtend.maraca.rmtx-ssr-browser-root.v2'}), /wrapper v1/);
  assert.throws(() => createMaracaRmtxSSRCompositionRoot({...wrapper(),extra:true}), /wrapper v1/);
  const mismatch = wrapper();mismatch.sourceIdentity.sourceHash='c'.repeat(64);
  assert.throws(() => createMaracaRmtxSSRCompositionRoot(mismatch), /differs/);
  let effects = 0;
  const dependencies = {nativeViewRuntimePort:{NATIVE_VIEW_PROJECTION_API_VERSION:'1.0.0',validateNativeViewProgram(){effects++;},materializeNativeView(){effects++;}}};
  const app = createMaracaRmtxSSRCompositionRoot(wrapper(), dependencies);
  assert.equal(app.schema, 'xtend.maraca.rmtx-ssr-browser-root.v1');
  assert.equal(app.facade.schema, app.schema);
  assert.equal(app.facade.apiVersion, '1.0.0');
  assert.equal(app.facade.snapshot().schema, 'xtend.maraca.plan-runtime.v18');
  const fabric = {runFiber(){effects++;}};
  for (const invalid of [{xtensions:{ssr:{schema:'xtend.maraca.xtension-ssr-options.v2'}}},{adoptExisting:true,xtensions:{ssr:{schema:'xtend.maraca.xtension-ssr-options.v3'}}}]) {
    await assert.rejects(app.boot({fabric,...invalid}), /requires explicit v3 options/);
  }
  await assert.rejects(app.boot({fabric,createXTensionHost(){effects++;},xtensions:{ssr:{schema:'xtend.maraca.xtension-ssr-options.v3'}}}), /manual host or binding authority/);
  await assert.rejects(app.boot({fabric,xtensions:{ssr:{schema:'xtend.maraca.xtension-ssr-options.v3'},grants:{foreign:{}},loadPeerGroup(){effects++;}}}), /no provider grants or peer loaders/);
  assert.equal(effects, 0);
});

test('a retained Plan runtime cannot accept the new prepared handoff', async () => {
  const { createMaracaPlanRuntime, createMaracaRmtxSSRPlanRuntime } = await load('xtend-maraca/plan-runtime.mjs');
  const options = {plan:{},rmtxSSRSession:{schema:'xtend.maraca.xtension-ssr-session.v3'}};
  assert.throws(() => createMaracaPlanRuntime(options), /legacy runtime cannot receive/);
  assert.throws(() => createMaracaRmtxSSRPlanRuntime(options), /prepared v3 session/);
});

test('native CSR preflight recognizes an SSR marker on its own root', async () => {
  const { JSDOM } = require('jsdom');
  const { createMaracaBrowserHostAdapter } = await load('xtend-maraca/browser-host-adapter.mjs');
  const dom = new JSDOM('<div id="root" data-maraca-ssr-shell><span>server</span></div>');
  try {
    const root = dom.window.document.getElementById('root');
    const before = root.outerHTML;
    const host = createMaracaBrowserHostAdapter({schema:'xtend.maraca.browser-composition-root.v11'}, {documentTarget:dom.window.document});
    assert.equal(host.inspectServerShell(root).active, true);
    assert.equal(root.outerHTML, before);
  } finally { dom.window.close(); }
});
