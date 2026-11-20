// SPDX-License-Identifier: Apache-2.0
'use strict';
const { fields, name, clone, freeze } = require('./state-binding-contract');
const { assertNativeCanonicalData } = require('./native-data');
const projections = require('./state-binding-projection');
const repeatScopes = require('./repeat-scopes');
function createNativeOrchestrationLifecycleRuntime({nativeScopes,apiVersion,planSchema,evaluationSchema,programSchema,headerSchema,sourceVersion,viewVersion,actionVersion}) {
function invalid(message) { const error = new TypeError(message); error.code = 'rmt.native-lifecycle.invalid'; throw error; }


const NATIVE_ORCHESTRATION_LIFECYCLE_API_VERSION = apiVersion;
const NATIVE_ORCHESTRATION_LIFECYCLE_PLAN_SCHEMA = planSchema;
const orchestrationOperations = new Set(['mount', 'hydrate', 'suspend', 'resume', 'invalidate', 'dispose', 'prewarm', 'recycle', 'detach', 'reattach']);
const orchestrationLanes = new Set(['user-blocking', 'visible', 'transition', 'idle', 'background', 'diagnostics']);
const validatedOrchestration = new WeakMap();
function validateNativeOrchestrationLifecyclePlan(program) {
  try {
    assertNativeCanonicalData(program, true);
    const plan = program?.lifecycle;
    fields(plan, ['schema', 'documentId', 'sourceProfile', 'viewProfile', 'actionProfile', 'operations'], 'Native orchestration lifecycle plan');
    const profile = (value, version) => { fields(value, ['syntax', 'version'], 'Lifecycle profile'); return value.syntax === 'rmtx' && value.version === version; };
    if (program.schema !== programSchema || program.render?.nativeView?.schema !== headerSchema
      || plan.schema !== NATIVE_ORCHESTRATION_LIFECYCLE_PLAN_SCHEMA || !profile(plan.sourceProfile, sourceVersion) || !profile(plan.viewProfile, viewVersion) || !profile(plan.actionProfile, actionVersion)
      || program.render.nativeView.documentId !== plan.documentId) invalid('Native orchestration requires exact Program5/Source7/View7/Action4 provenance.');
    name(plan.documentId);
    if (!Array.isArray(plan.operations) || plan.operations.length > 256) invalid('Lifecycle operations require a bounded dense array.');
    const surfaces = new Map((program.surfaces || []).map(surface => [surface.id, surface]));
    const headerScopes = new Map((program.render.nativeView.scopes || []).map(scope => [scope.surface, scope]));
    const owners = new Set(program.render.nativeView.surfaces || [...headerScopes.keys()]);
    const symbols = { state: new Set((program.state?.states || []).map(row => row.id)), selector: new Set((program.state?.selectors || []).map(row => row.id)) };
    const ids = new Set(), kinds = new Set();
    for (const operation of plan.operations) {
      fields(operation, ['id', 'astPointer', 'ownerSurface', 'target', 'op', 'lane', 'when', 'repeat'], 'Native orchestration lifecycle operation');
      for (const key of ['id', 'ownerSurface', 'target', 'lane']) name(operation[key]);
      const kind = JSON.stringify([operation.ownerSurface, operation.op]);
      if (ids.has(operation.id) || kinds.has(kind) || !orchestrationOperations.has(operation.op) || !orchestrationLanes.has(operation.lane)
        || operation.target !== operation.ownerSurface || typeof operation.astPointer !== 'string' || !/^\/body\/\d+(?:\/body\/\d+)*$/u.test(operation.astPointer)) invalid('Lifecycle operations must distinctly target their owning native Surface.');
      ids.add(operation.id); kinds.add(kind);
      const surface = surfaces.get(operation.ownerSurface), scope = headerScopes.get(operation.ownerSurface);
      if (!surface || !owners.has(operation.ownerSurface) || surface.source || JSON.stringify(scope?.repeat || null) !== JSON.stringify(operation.repeat || null)) invalid('Lifecycle scopes must match the exact Native View owner and repeat chain.');
      repeatScopes.validateRepeat(operation.repeat);
      if (program.kernel?.records) {
        const fibers = program.kernel.records.fibers?.filter(row => row.operation === operation.id);
        const origin = program.kernel.sourceMap?.filter(row => row.id === `src:${operation.id}` && row.astPointer === operation.astPointer && row.nodeType === 'RmtLifecycleStatement');
        if (fibers?.length !== 1 || fibers[0].op !== operation.op || fibers[0].target?.ref !== operation.target || fibers[0].source || origin?.length !== 1) invalid('Lifecycle commands require exact compiled Kernel/source-map provenance.');
      }
      const dummy = { keys: (operation.repeat || []).map(() => 'validated-key'), ...(operation.repeat ? {repeat: operation.repeat} : {}) };
      projections.validateProjection(nativeScopes.scopeNativeProjection(operation.when, dummy));
      projections.visitProjection(operation.when, node => {
        if (['object', 'array'].includes(node.kind)) invalid('Lifecycle guards require scalar projection IR3.');
        if (node.kind === 'path') {
          if (!symbols[node.root].has(node.symbol)) invalid('Lifecycle guards reference an undeclared Model/selector symbol.');
          nativeScopes.scopeNativeProjection(node, dummy);
        }
      });
      if (operation.when.kind === 'literal' && typeof operation.when.value !== 'boolean') invalid('Lifecycle guards require strictly Boolean values.');
    }
    const result = freeze(clone(plan)); validatedOrchestration.set(result, program); return result;
  } catch (error) { if (error.code === 'rmt.native-lifecycle.invalid') throw error; invalid(error.message); }
}
function evaluateNativeOrchestrationLifecyclePlan(plan, snapshot, materialization) {
  const program = validatedOrchestration.get(plan);
  if (!program) invalid('Lifecycle evaluation requires its immutable validated Source7 plan.');
  try {
    assertNativeCanonicalData(snapshot, true);
    const scopes = materialization ? nativeScopes.validateNativeSurfaceMaterialization(program, materialization) : nativeScopes.materializeNativeSurfaceScopes(program, snapshot);
    assertNativeCanonicalData(scopes);
    const results = [];
    for (const operation of plan.operations) for (const scope of scopes.instances.filter(row => row.surfaceId === operation.ownerSurface)) {
      const projection = nativeScopes.scopeNativeProjection(operation.when, scope);
      const enabled = projections.evaluateProjection(projection, {states: snapshot.states, selectors: snapshot.selectors || {}});
      if (typeof enabled !== 'boolean') invalid('Lifecycle guards require Boolean values, not truthiness.');
      results.push({ id: JSON.stringify([operation.id, scope.keys]), operationId: operation.id, surfaceId: scope.id, declarationSurface: operation.ownerSurface,
        keys: clone(scope.keys), op: operation.op, lane: operation.lane, enabled });
    }
    const bySurface = new Map();
    for (const row of results.filter(row => row.enabled)) { if (!bySurface.has(row.surfaceId)) bySurface.set(row.surfaceId, new Set()); bySurface.get(row.surfaceId).add(row.op); }
    for (const operations of bySurface.values()) {
      if (operations.has('suspend') && operations.has('resume') || operations.has('detach') && operations.has('reattach') || operations.has('dispose') && operations.has('recycle'))
        invalid('Conflicting lifecycle commands cannot be enabled atomically for one Surface.');
    }
    return freeze({schema: evaluationSchema, operations: results, scopes: clone(scopes)});
  } catch (error) { if (error.code === 'rmt.native-lifecycle.invalid') throw error; invalid(error.message); }
}
function nativeOrchestrationLifecycleAdmission(program, snapshot, restriction = {}) {
  const plan = validateNativeOrchestrationLifecyclePlan(program), evaluation = evaluateNativeOrchestrationLifecyclePlan(plan, snapshot);
  assertNativeCanonicalData(restriction);
  if (Object.values(restriction).some(value => typeof value !== 'boolean')) invalid('Lifecycle restrictions must be Boolean.');
  const denied = new Set(evaluation.operations.filter(row => row.op === 'mount' && !row.enabled).map(row => row.surfaceId));
  const index = new Map(evaluation.scopes.instances.map(row => [row.id, row])), result = Object.create(null), visiting = new Set();
  function allow(id) {
    if (Object.hasOwn(result, id)) return result[id];
    if (visiting.has(id)) invalid('Cyclic lifecycle instance parents.'); visiting.add(id);
    const parent = index.get(id)?.parentId;
    result[id] = !denied.has(id) && (!Object.hasOwn(restriction, id) || restriction[id] !== false) && (!parent || allow(parent));
    visiting.delete(id); return result[id];
  }
  for (const scope of index.values()) allow(scope.id);
  return freeze(result);
}
return { NATIVE_ORCHESTRATION_LIFECYCLE_API_VERSION, NATIVE_ORCHESTRATION_LIFECYCLE_PLAN_SCHEMA, validateNativeOrchestrationLifecyclePlan, evaluateNativeOrchestrationLifecyclePlan, nativeOrchestrationLifecycleAdmission };

}
module.exports = {createNativeOrchestrationLifecycleRuntime};
