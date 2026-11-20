import test from 'node:test';
import assert from 'node:assert/strict';
import * as orchestration from '../../xtend-maraca/native-orchestration-runtime.mjs';
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
