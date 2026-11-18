import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createMaracaPlanRuntime } from '../../xtend-maraca/plan-runtime.mjs';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { buildMaracaBundle } = require('../../xtend-maraca');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const source = `import {RMT,model,result} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="native-boundaries">
  <RMT.State id="remote" type="object" initial={{id:1}}/>
  <RMT.DataSource id="records" sourceKind="endpoint" source="/api/records" mode="invoke"/>
  <RMT.Action id="load"><RMT.Effect kind="fetch" sourceKind="datasource" source="records"/>
    <RMT.ResultHandler phase="success" kind="reduce" state="remote" value={result}/>
  </RMT.Action>
  <RMT.Surface id="owner" component="section"><RMT.View>
    <RMT.Element tag="h1" attributes={{id:'remote-id'}}><RMT.Text value={model.remote.id}/></RMT.Element>
  </RMT.View></RMT.Surface>
</RMT.Program>`;

function build() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-native-boundaries-'));
  const sourcePath = path.join(temporary, 'source.rmtx'), outputDir = path.join(temporary, 'build');
  fs.writeFileSync(sourcePath, source);
  try {
    const result = buildMaracaBundle({ source: sourcePath, out: outputDir, rmtxSyntaxVersion: '5.0.0',
      profile: 'production', orchestration: 'strict', kernel: 'strict', hydration: 'off',
      validation: 'off', transitions: 'off', services: false, pwa: false, lazy: false }, { rootDir });
    assert.equal(result.ok, true, result.status + JSON.stringify(result.plan.diagnostics));
    assert.equal(result.plan.schema, 'xtend.maraca.build-plan.v9');
    assert.equal(result.plan.xtensionComposition, undefined);
    return { temporary, outputDir, result };
  } catch (error) { fs.rmSync(temporary, { recursive: true, force: true }); throw error; }
}

test('native-only synchronous builds budget every actual delivered file, including the native projector', context => {
  const fixture = build();
  try {
    const { result, outputDir } = fixture, files = result.bundleReport.bundleFiles;
    const nativeAsset = files.find(file => file.fileName === 'runtime/xtend-maraca-native-view.mjs');
    assert(nativeAsset);
    const nativeBytes = fs.readFileSync(path.join(outputDir, nativeAsset.fileName));
    assert.equal(nativeAsset.bytes, nativeBytes.length);
    context.diagnostic(JSON.stringify({ nativeAsset: nativeAsset.fileName, bytes: nativeBytes.length,
      sha256: createHash('sha256').update(nativeBytes).digest('hex') }));
    const actualBytes = files.reduce((sum, file) => {
      const bytes = fs.statSync(path.join(outputDir, file.fileName)).size;
      assert.equal(file.bytes, bytes, file.fileName);
      return sum + bytes;
    }, 0);
    assert(actualBytes > result.bundleReport.entryBytes);
    assert.equal(result.sizeBudgetReport.bundleBytes, actualBytes);
    assert.equal(result.bundleReport.bytes, actualBytes);
    assert.equal(result.sizeBudgetReport.framework.bytes + result.sizeBudgetReport.microkernel.bytes, actualBytes);
    assert(result.sizeBudgetReport.microkernel.bytes > 0);
  } finally { fs.rmSync(fixture.temporary, { recursive: true, force: true }); }
});

test('native Action result data is validated before managed result reducers can clone negative zero', async () => {
  const fixture = build(), dom = new JSDOM('<main></main>', { pretendToBeVisual: true, url: 'https://xtend.test/native-boundaries' });
  const previousGlobals = new Map();
  for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent']) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  }
  dom.window.__XTendMaracaDisableAutoBoot = true;
  const fabric = createXtendFabric();
  let composition;
  try {
    const entry = await import(pathToFileURL(fixture.result.plan.outputs.entry).href);
    composition = entry.createXtendMaraca();
    const root = dom.window.document.querySelector('main');
    let response = { id: -0 }, fetchCalls = 0;
    await composition.facade.boot({ root, fabric, dataSourceAdapters: { rest: { async fetch() { fetchCalls++; return response; } } } });
    const model = composition.facade.model, heading = root.querySelector('#remote-id');
    assert.equal(heading.textContent, '1');
    let modelEvents = 0;
    const unsubscribe = model.subscribe(() => modelEvents++);
    try {
      await assert.rejects(composition.facade.dispatchCommand('load'), /negative zero|canonical zero/iu);
      assert.equal(fetchCalls, 1);
      assert.equal(Object.is(response.id, -0), true);
      assert.deepEqual(model.getState('remote'), { id: 1 });
      assert.equal(modelEvents, 0);
      assert.equal(root.querySelector('#remote-id'), heading);
      assert.equal(heading.textContent, '1');
      response = { id: 0 };
      await composition.facade.dispatchCommand('load');
      assert.equal(fetchCalls, 2);
      assert.deepEqual(model.getState('remote'), { id: 0 });
      assert.equal(modelEvents, 1);
      assert.equal(root.querySelector('#remote-id'), heading);
      assert.equal(heading.textContent, '0');
    } finally { unsubscribe(); }
  } finally {
    await composition?.facade.dispose();
    fabric.dispose?.(); dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    fs.rmSync(fixture.temporary, { recursive: true, force: true });
  }
});

test('the native profile discriminator rejects schema accessors and normalization profile changes', () => {
  const fixture = build(), plan = JSON.parse(JSON.stringify(fixture.result.plan));
  const nativeViewRuntimePort = require('../../tools/xtensions/native-view-projection');
  const fabric = createXtendFabric();
  try {
    const options = { plan, nativeViewRuntimePort, fabric, root: {} };
    const valid = createMaracaPlanRuntime(options);
    assert.equal(valid.schema, 'xtend.maraca.plan-runtime.v14'); valid.dispose();
    const accessorPlan = { ...plan };
    let getterReads = 0;
    Object.defineProperty(accessorPlan, 'schema', { enumerable: true, get() {
      return ++getterReads === 1 ? 'xtend.maraca.build-plan.v8' : 'xtend.maraca.build-plan.v9';
    } });
    assert.throws(() => createMaracaPlanRuntime({ ...options, plan: accessorPlan,
      initialState: { remote: { id: -0 } } }), /schema must be an own data field/iu);
    assert.equal(getterReads, 0);
    let toJSONCalls = 0;
    const transformingPlan = { ...plan, schema: 'xtend.maraca.build-plan.v8', toJSON() { toJSONCalls++; return plan; } };
    assert.throws(() => createMaracaPlanRuntime({ ...options, plan: transformingPlan,
      initialState: { remote: { id: -0 } } }), /explicit own schema field before normalization/iu);
    assert.equal(toJSONCalls, 1);
  } finally { fabric.dispose?.(); fs.rmSync(fixture.temporary, { recursive: true, force: true }); }
});
