// SPDX-License-Identifier: Apache-2.0
'use strict';
const { assertNativeCanonicalData } = require('./native-data');

/** Private pure initial-Model preview. The platform injects exactly its compiled
 * lifecycle profile, without importing other Source versions or creating live
 * Kernel/Surface authority. Actual lifetimes retain their runtime masks. */
function createRMTXSSRBindingAdmissionRuntime(ports = {}) {
  const schema = ports.programSchema;
  if (schema !== undefined && !['xtend.rmt.app-orchestration.v4', 'xtend.rmt.app-orchestration.v5', 'xtend.rmt.app-orchestration.v6'].includes(schema)) throw new TypeError('Unknown SSR lifecycle preview profile.');
  if (schema === 'xtend.rmt.app-orchestration.v4' ? typeof ports.nativeLifecycleAdmission !== 'function'
    : schema !== undefined && ['validateLifecyclePlan', 'evaluateLifecyclePlan', 'nativeOrchestrationAdmission'].some(key => typeof ports[key] !== 'function')) throw new TypeError('SSR preview requires its matching lifecycle ports.');
  return function createRMTXSSRBindingAdmission(program, snapshot) {
    if (!['xtend.rmt.app-orchestration.v4', 'xtend.rmt.app-orchestration.v5', 'xtend.rmt.app-orchestration.v6'].includes(program?.schema)) return undefined;
    if (program.schema !== schema) throw new TypeError('The SSR preview profile differs from the compiled native program.');
    assertNativeCanonicalData(snapshot, true);
    const definitions = new Map((program.surfaces || []).map(row => [row.id, row]));
    if (schema === 'xtend.rmt.app-orchestration.v4') {
      const restriction = Object.fromEntries([...definitions].map(([id, row]) => [id, row.initialState !== 'closed']));
      return ports.nativeLifecycleAdmission(program, snapshot, restriction);
    }
    const lifecycle = ports.validateLifecyclePlan(program), evaluation = ports.evaluateLifecyclePlan(lifecycle, snapshot);
    const restriction = Object.create(null);
    for (const row of evaluation.scopes.instances) {
      const operations = evaluation.operations.filter(operation => operation.surfaceId === row.id);
      const hasHydrate = operations.some(operation => operation.op === 'hydrate');
      const willHydrate = operations.some(operation => operation.op === 'hydrate' && operation.enabled);
      restriction[row.id] = definitions.get(row.surfaceId)?.initialState !== 'closed'
        && (!hasHydrate || willHydrate)
        && !operations.some(operation => operation.enabled && ['dispose', 'detach', 'suspend'].includes(operation.op));
    }
    return ports.nativeOrchestrationAdmission(program, snapshot, restriction);
  };
}
module.exports = { createRMTXSSRBindingAdmissionRuntime };
