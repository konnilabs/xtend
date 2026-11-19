// SPDX-License-Identifier: Apache-2.0
'use strict';
const { fields, name, segments, clone, freeze } = require('./state-binding-contract');
const { assertNativeCanonicalData } = require('./native-data');
const projections = require('./state-binding-projection');

const NATIVE_LIFECYCLE_API_VERSION = '1.0.0';
const NATIVE_LIFECYCLE_PLAN_SCHEMA = 'xtend.rmt.native-lifecycle-plan.v1';
const validated = new WeakSet();
function invalid(message) { const error = new TypeError(message); error.code = 'rmt.native-lifecycle.invalid'; throw error; }
function validateNativeLifecyclePlan(program) {
  try {
    assertNativeCanonicalData(program, true);
    const plan = program?.lifecycle;
    assertNativeCanonicalData(plan);
    fields(plan, ['schema', 'documentId', 'sourceProfile', 'viewProfile', 'actionProfile', 'operations'], 'Native lifecycle plan');
    const profile = (value, version) => { fields(value, ['syntax', 'version'], 'Native lifecycle profile'); return value.syntax === 'rmtx' && value.version === version; };
    if (plan.schema !== NATIVE_LIFECYCLE_PLAN_SCHEMA || !profile(plan.sourceProfile, '6.0.0') || !profile(plan.viewProfile, '5.0.0') || !profile(plan.actionProfile, '4.0.0'))
      invalid('Native lifecycle requires the explicit Source6/View5/Action4 plan.');
    name(plan.documentId);
    if (!Array.isArray(plan.operations) || plan.operations.length > 256) invalid('Native lifecycle operations require a bounded dense array.');
    const surfaces = program && new Map((program.surfaces || []).map(surface => [surface.id, surface]));
    const owners = program && new Set(program.render?.nativeView?.surfaces || []);
    const symbols = program && { state: new Set((program.state?.states || []).map(value => value.id)), selector: new Set((program.state?.selectors || []).map(value => value.id)) };
    if (program && (program.schema !== 'xtend.rmt.app-orchestration.v4' || program.render?.nativeView?.documentId !== plan.documentId))
      invalid('Native lifecycle plan must belong to its exact Program4 Native View document.');
    const ids = new Set(), guarded = new Set();
    for (const operation of plan.operations) {
      fields(operation, ['id', 'astPointer', 'ownerSurface', 'target', 'op', 'lane', 'when'], 'Native lifecycle operation');
      for (const key of ['id', 'ownerSurface', 'target', 'lane']) name(operation[key]);
      if (ids.has(operation.id) || guarded.has(operation.ownerSurface)) invalid('Native lifecycle requires one distinct guarded mount per owning Surface.');
      ids.add(operation.id); guarded.add(operation.ownerSurface);
      if (typeof operation.astPointer !== 'string' || !/^\/body\/\d+(?:\/body\/\d+)*$/u.test(operation.astPointer) || operation.op !== 'mount' || operation.target !== operation.ownerSurface)
        invalid('Native lifecycle supports only a guarded mount targeting its own static Surface.');
      if (operation.lane !== 'visible') invalid('Native lifecycle content admission currently requires the visible lane.');
      const surface = surfaces?.get(operation.ownerSurface);
      if (program && (!surface || !owners.has(operation.ownerSurface) || surface.repeat || surface.key || surface.source))
        invalid('Native lifecycle requires an ordinary static owning Surface with a Native View and no source or repeat.');
      if (program.kernel?.records) {
        const fiber = program.kernel.records.fibers?.filter(value => value.operation === operation.id);
        const origin = program.kernel.sourceMap?.filter(value => value.id === `src:${operation.id}` && value.astPointer === operation.astPointer && value.nodeType === 'RmtLifecycleStatement');
        if (fiber?.length !== 1 || fiber[0].op !== 'mount' || fiber[0].target?.ref !== operation.target || fiber[0].source || origin?.length !== 1)
          invalid('Native lifecycle operation must retain its exact compiled Kernel/source-map provenance.');
      }
      projections.validateProjection(operation.when);
      projections.visitProjection(operation.when, node => {
        if (node.kind === 'array' || node.kind === 'object') invalid('Native lifecycle conditions require scalar projection IR3.');
        if (node.kind === 'literal' && (node.value !== null && !['string', 'boolean', 'number'].includes(typeof node.value))) invalid('Native lifecycle literals must be scalar.');
        if (node.kind === 'path') {
          segments(node.path);
          if (symbols && !symbols[node.root].has(node.symbol)) invalid('Native lifecycle references an undeclared Model or selector symbol.');
        }
      });
      if (operation.when.kind === 'literal' && typeof operation.when.value !== 'boolean') invalid('Native lifecycle guards require a boolean, not truthiness.');
    }
    const result = freeze(clone(plan)); validated.add(result); return result;
  } catch (error) { if (error.code === 'rmt.native-lifecycle.invalid') throw error; invalid(error.message); }
}
function evaluateNativeLifecyclePlan(input, snapshot) {
  if (!validated.has(input)) invalid('Evaluate requires an immutable validated Native lifecycle plan.');
  const plan = input;
  try {
    assertNativeCanonicalData(snapshot, true);
    const current = { states: snapshot.states, selectors: snapshot.selectors || {} };
    const allowed = [], blocked = [];
    // Validate/evaluate the complete group before returning any admission fact.
    for (const operation of plan.operations) {
      const value = projections.evaluateProjection(operation.when, current);
      if (typeof value !== 'boolean') invalid('Native lifecycle guards require a boolean, not truthiness.');
      (value ? allowed : blocked).push(operation.ownerSurface);
    }
    return freeze({ allowed, blocked });
  } catch (error) { if (error.code === 'rmt.native-lifecycle.invalid') throw error; invalid(error.message); }
}
const programCache = new WeakMap();
function nativeLifecycleParents(program) {
  assertNativeCanonicalData(program, true);
  const parents = Object.create(null);
  for (const surface of program.surfaces || []) if (surface.parentId || surface.parent) parents[surface.id] = surface.parentId || surface.parent;
  const visit = (node, parent = null) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(value => visit(value, parent)); return; }
    if (typeof node.surface === 'string') {
      if (parent && parent !== node.surface) parents[node.surface] = parent;
      parent = node.surface;
    }
    for (const key of ['children', 'then', 'else', 'template', 'node', 'child', 'content', 'fallback', 'descriptors', 'nodes']) visit(node[key], parent);
  };
  visit(program.render.root);
  for (const id of Object.keys(parents)) {
    const seen = new Set([id]); let parent = parents[id];
    while (parent) { if (seen.has(parent)) invalid('Cyclic Native lifecycle scope parents.'); seen.add(parent); parent = parents[parent]; }
  }
  return freeze(parents);
}
function nativeLifecycleAdmission(program, snapshot, restriction = {}) {
  let cached = programCache.get(program);
  if (!cached) { cached = { plan: validateNativeLifecyclePlan(program), parents: nativeLifecycleParents(program) }; programCache.set(program, cached); }
  assertNativeCanonicalData(restriction);
  if (Object.values(restriction).some(value => typeof value !== 'boolean')) invalid('Lifecycle admission restrictions must be booleans.');
  const direct = evaluateNativeLifecyclePlan(cached.plan, snapshot), denied = new Set(direct.blocked), result = Object.create(null);
  const visiting = new Set();
  const allows = id => {
    if (Object.hasOwn(result, id)) return result[id];
    if (visiting.has(id)) invalid('Cyclic Native lifecycle scope parents.');
    visiting.add(id);
    result[id] = !denied.has(id) && (!Object.hasOwn(restriction, id) || restriction[id] !== false) && (!cached.parents[id] || allows(cached.parents[id]));
    visiting.delete(id); return result[id];
  };
  for (const surface of program.surfaces || []) allows(surface.id);
  return freeze(result);
}
module.exports = { NATIVE_LIFECYCLE_API_VERSION, NATIVE_LIFECYCLE_PLAN_SCHEMA, validateNativeLifecyclePlan, evaluateNativeLifecyclePlan,
  nativeLifecycleParents, nativeLifecycleAdmission };
