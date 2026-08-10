import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registrySource = await readFile(new URL('../../xtend-registry.mjs', import.meta.url), 'utf8');
const loaderSource = await readFile(new URL('../../xtend-loader.js', import.meta.url), 'utf8');
const esmDemoSource = await readFile(new URL('../../demos/esm-app/app.js', import.meta.url), 'utf8');

const loaderBeforeImport = globalThis.XTendLoader;
const registry = await import('../../xtend.ssr.mjs');

const requiredExports = [
  'schedule', 'afterPaint', 'render', 'renderNode', 'loadComponent', 'hydrate', 'boot',
  'createApp', 'createStore', 'createEffects', 'createRouter', 'createAnimator',
  'createValidator', 'createTransitions', 'createResources', 'createFabric',
  'configureXTend', 'disposeXTend'
  , 'readyXTend', 'getXTendHost', 'getXTendSnapshot', 'renderKeyed', 'patchElement', 'commit', 'createXTendRegistry'
];

requiredExports.forEach((name) => assert.equal(typeof registry[name], 'function', `${name} is exported`));
assert.equal(globalThis.XTendLoader, loaderBeforeImport, 'registry import does not boot the Classic loader');
assert.equal(globalThis.XTendRmtAppRuntime, undefined, 'registry import does not expose RMT globals');
assert.ok(registrySource.includes('const needsBootGuard = !previousBootState') && registrySource.includes('target.__XTendLoaderBootPromise = previousBootState') && registrySource.includes("delete target.__XTendLoaderBootPromise"), 'lazy loader interop suppresses implicit Classic auto-boot and restores a host-owned boot slot');
assert.ok(registrySource.includes('target.__XTendLoaderSuppressAutoBoot = true') && loaderSource.includes('window.__XTendLoaderSuppressAutoBoot !== true'), 'Registry and Classic loader share an explicit auto-boot suppression contract');
assert.ok(esmDemoSource.includes("manifest: { 'x-status': '/components/xstatus.js' }"), 'ESM demo uses an explicit component mapping instead of a page-relative manifest');
assert.throws(() => registry.createApp(), (error) => error.code === 'XTEND_NOT_READY', 'kernel mode is fail-closed before readiness');
await registry.readyXTend({ fabric: false });
assert.ok(registry.createApp(), 'createApp delegates to the kernel-bound RMT app runtime');
assert.ok(registry.createStore(), 'createStore delegates to the kernel-bound state runtime');
assert.equal(registry.getXTendHost().mode, 'kernel');
assert.deepEqual(
  Object.keys(registry.getXTendHost()).sort(),
  ['mode', 'schema', 'snapshot'],
  'managed Registry host exposes only its read-only MVC facade'
);
assert.equal(Object.isFrozen(registry.getXTendHost()), true, 'managed Registry host facade is frozen');
assert.equal(Object.isFrozen(registry.getXTendSnapshot()), true, 'managed Registry snapshots are frozen');
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

const isolatedSchedulerA = {
  scheduleEndpoint(_endpoint, _scope, callback) { callback(); return () => {}; },
  afterPaint(callback) { callback(); return () => {}; },
  dispose() {}
};
const isolatedSchedulerB = {
  scheduleEndpoint(_endpoint, _scope, callback) { callback(); return () => {}; },
  afterPaint(callback) { callback(); return () => {}; },
  dispose() {}
};
const isolatedA = registry.createXTendRegistry({ orchestration: 'lightweight', scheduler: isolatedSchedulerA });
const isolatedB = registry.createXTendRegistry({ orchestration: 'lightweight', scheduler: isolatedSchedulerB });
await isolatedA.readyXTend();
assert.equal(isolatedA.getXTendSnapshot().status, 'ready', 'instance-scoped Registry can boot independently');
assert.throws(() => isolatedB.getXTendHost(), /requires await readyXTend/, 'a second Registry context does not inherit lifecycle state');
await isolatedB.readyXTend();
isolatedA.disposeXTend();
assert.equal(isolatedB.getXTendSnapshot().status, 'ready', 'disposing one Registry context leaves the other context ready');
isolatedB.disposeXTend();

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
  commit(request) { return { operation: request.operation }; },
  render(root, descriptor) { return { root, descriptor }; },
  renderNode(descriptor) { return { descriptor }; },
  dispose() {}
};
registry.configureXTend({ orchestration: 'lightweight', renderer: fakeRenderer });
assert.deepEqual(registry.renderNode('descriptor'), { descriptor: 'descriptor' }, 'renderNode delegates to an injected SSR renderer');
assert.deepEqual(registry.commit({ operation: 'create-node', descriptor: 'descriptor' }), { operation: 'create-node' }, 'commit delegates synchronously to the configured renderer');
registry.disposeXTend();
registry.configureXTend({ orchestration: 'lightweight' });
assert.throws(() => registry.renderNode({ type: 'text', text: 'SSR' }), /documentTarget/, 'SSR rendering requires an injected DOM');
await assert.rejects(() => registry.boot(), /browser-only/, 'SSR loader aliases fail explicitly');
registry.disposeXTend();

await import('./xtendrmt_esm_factory_snapshot_suite.mjs');
console.log('XTend ESM registry contract passed.');
