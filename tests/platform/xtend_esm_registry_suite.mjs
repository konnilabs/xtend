import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registrySource = await readFile(new URL('../../xtend-registry.mjs', import.meta.url), 'utf8');
const esmDemoSource = await readFile(new URL('../../demos/esm-app/app.js', import.meta.url), 'utf8');

const loaderBeforeImport = globalThis.XTendLoader;
const registry = await import('../../xtend.ssr.mjs');

const requiredExports = [
  'schedule', 'afterPaint', 'render', 'renderNode', 'loadComponent', 'hydrate', 'boot',
  'createApp', 'createStore', 'createEffects', 'createRouter', 'createAnimator',
  'createValidator', 'createTransitions', 'createResources', 'createFabric',
  'configureXTend', 'disposeXTend'
  , 'readyXTend', 'getXTendHost', 'getXTendSnapshot', 'renderKeyed', 'patchElement'
];

requiredExports.forEach((name) => assert.equal(typeof registry[name], 'function', `${name} is exported`));
assert.equal(globalThis.XTendLoader, loaderBeforeImport, 'registry import does not boot the Classic loader');
assert.equal(globalThis.XTendRmtAppRuntime, undefined, 'registry import does not expose RMT globals');
assert.ok(registrySource.includes('const bootGuard = Promise.resolve(null)') && registrySource.includes("delete target.__XTendLoaderBootPromise"), 'lazy loader interop suppresses implicit Classic auto-boot');
assert.ok(esmDemoSource.includes("manifest: { 'x-status': '/components/xstatus.js' }"), 'ESM demo uses an explicit component mapping instead of a page-relative manifest');
assert.throws(() => registry.createApp(), (error) => error.code === 'XTEND_NOT_READY', 'kernel mode is fail-closed before readiness');
await registry.readyXTend({ fabric: false });
assert.ok(registry.createApp(), 'createApp delegates to the kernel-bound RMT app runtime');
assert.ok(registry.createStore(), 'createStore delegates to the kernel-bound state runtime');
assert.equal(registry.getXTendHost().mode, 'kernel');
assert.equal(registry.getXTendSnapshot().status, 'booted');
let kernelScheduled = false;
const kernelCancel = registry.schedule(() => { kernelScheduled = true; }, {
  endpointName: 'test.registry.endpoint', scope: 'test.registry', lane: 'visible', timeout: 1, correlationId: 'test:registry:1'
});
assert.equal(typeof kernelCancel, 'function', 'kernel scheduling remains abortable');
await new Promise((resolve) => setTimeout(resolve, 50));
assert.equal(kernelScheduled, true, 'kernel scheduler bridge executes custom endpoints');
assert.ok(registry.getXTendSnapshot().fibers.some((entry) => entry.endpointName === 'test.registry.endpoint'), 'custom endpoints appear in kernel diagnostics');
registry.disposeXTend();

let scheduled = 0;
const fakeScheduler = {
  scheduleEndpoint(_endpoint, _scope, callback) { callback(); return () => { scheduled -= 1; }; },
  afterPaint(callback) { callback(); return () => {}; },
  dispose() { scheduled = -100; }
};
registry.configureXTend({ orchestration: 'lightweight', scheduler: fakeScheduler });
registry.schedule(() => { scheduled += 1; });
assert.equal(scheduled, 1, 'schedule delegates to the configured singleton');
assert.throws(() => registry.configureXTend({}), /already initialized/, 'late configuration is rejected');
registry.disposeXTend();
assert.equal(scheduled, -100, 'disposeXTend disposes the singleton');
const fakeRenderer = {
  render(root, descriptor) { return { root, descriptor }; },
  renderNode(descriptor) { return { descriptor }; },
  dispose() {}
};
registry.configureXTend({ orchestration: 'lightweight', renderer: fakeRenderer });
assert.deepEqual(registry.renderNode('descriptor'), { descriptor: 'descriptor' }, 'renderNode delegates to an injected SSR renderer');
registry.disposeXTend();
registry.configureXTend({ orchestration: 'lightweight' });
assert.throws(() => registry.renderNode({ type: 'text', text: 'SSR' }), /documentTarget/, 'SSR rendering requires an injected DOM');
await assert.rejects(() => registry.boot(), /browser-only/, 'SSR loader aliases fail explicitly');
registry.disposeXTend();

console.log('XTend ESM registry contract passed.');
