import test from 'node:test';
import assert from 'node:assert/strict';
import * as orchestration from '../../xtend-maraca/native-orchestration-runtime.mjs';
import * as lifecycle from '../../xtend-maraca/native-lifecycle-runtime.mjs';
import * as managed from '../../xtend-maraca/native-managed-runtime.mjs';
import * as ssrLifecycle from '../../xtend-maraca/native-lifecycle-ssr-runtime.mjs';
import * as ssrOrchestration from '../../xtend-maraca/native-orchestration-ssr-runtime.mjs';
import * as ssrManaged from '../../xtend-maraca/native-managed-ssr-runtime.mjs';
import * as graph from '../../xtend-maraca/native-surface-graph.mjs';
import bindings from '../../tools/xtensions/state-binding.js';

test('Source7 public native modules preserve their versioned baseline export sets', () => {
  assert.deepEqual(Object.keys(orchestration).sort(), ['NATIVE_ORCHESTRATION_RUNTIME_API_VERSION', 'createMaracaNativeOrchestrationRuntime', 'default'].sort());
  assert.deepEqual(Object.keys(graph).sort(), ['NATIVE_SURFACE_GRAPH_API_VERSION', 'NATIVE_SURFACE_GRAPH_SCHEMA', 'createMaracaNativeSurfaceGraph', 'default'].sort());
  assert.equal(orchestration.NATIVE_ORCHESTRATION_RUNTIME_API_VERSION, '2.0.0');
  assert.equal(graph.NATIVE_SURFACE_GRAPH_API_VERSION, '3.0.0');
  assert.equal(bindings.XTENSION_STATE_BINDING_API_VERSION, '2.4.0');
  assert.equal(Object.hasOwn(bindings, '_createStateRegistry'), false);
});

test('retained Source6 and Source8 modules preserve their independent CSR export sets', () => {
  assert.deepEqual(Object.keys(lifecycle).sort(), ['NATIVE_LIFECYCLE_RUNTIME_API_VERSION','createMaracaNativeLifecycleRuntime','default'].sort());
  assert.deepEqual(Object.keys(managed).sort(), ['NATIVE_MANAGED_RUNTIME_API_VERSION','createMaracaNativeManagedRuntime','default'].sort());
  assert.equal(lifecycle.NATIVE_LIFECYCLE_RUNTIME_API_VERSION,'1.0.0');
  assert.equal(managed.NATIVE_MANAGED_RUNTIME_API_VERSION,'3.0.0');
});

test('new SSR entries expose their API1 handoff without private integration hooks', () => {
  for(const [api,legacy,marker,factory,legacyFactory] of [
    [ssrLifecycle,lifecycle,'NATIVE_LIFECYCLE_SSR_RUNTIME_API_VERSION','createMaracaRmtxSSRNativeLifecycleRuntime','createMaracaNativeLifecycleRuntime'],
    [ssrOrchestration,orchestration,'NATIVE_ORCHESTRATION_SSR_RUNTIME_API_VERSION','createMaracaRmtxSSRNativeOrchestrationRuntime','createMaracaNativeOrchestrationRuntime'],
    [ssrManaged,managed,'NATIVE_MANAGED_SSR_RUNTIME_API_VERSION','createMaracaRmtxSSRNativeManagedRuntime','createMaracaNativeManagedRuntime']
  ]) {
    assert.deepEqual(Object.keys(api).sort(),[marker,factory,legacyFactory,'createMaracaRmtxSSRModelSnapshot'].sort());
    assert.equal(api[marker],'1.0.0');
    assert.equal(api[legacyFactory],legacy[legacyFactory]);
    assert.equal(Object.hasOwn(api,'nativeLifecycleRuntimePort'),false);
    assert.equal(Object.hasOwn(api,'createNativeLifecycleIntegration'),false);
    let reads=0;
    assert.throws(()=>api[factory]({plan:Object.defineProperty({},'schema',{get(){reads++;throw Error('schema getter executed');}})}),/own data plan/u);
    assert.equal(reads,0);
  }
});
