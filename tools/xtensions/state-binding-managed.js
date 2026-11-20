// SPDX-License-Identifier: Apache-2.0
'use strict';
const artifactApi = require('./state-binding-artifact');
const contract = require('./state-binding-contract');
const { expandRepeatScopes, templatePath } = require('./repeat-scopes');
const { assertNativeCanonicalData } = require('./native-data');
const life = require('./native-managed-lifecycle');
const viewApi = require('./native-managed-view-validation');
const scopeApi = require('./native-managed-surface-scopes');
const { createStateRegistry } = require('./state-binding-registry-core');
const XTENSION_STATE_BINDING_API_VERSION = '2.4.0';
const XTENSION_MANAGED_STATE_BINDING_API_VERSION = '7.0.0';
const MANAGED_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v8';
function createXTensionManagedStateRegistry(options) {
  const registry = createStateRegistry(options, false, true, assertNativeCanonicalData, XTENSION_MANAGED_STATE_BINDING_API_VERSION);
  return Object.freeze({ ...registry, bind(input, createHost) { assertNativeCanonicalData(input); return registry.bind(input, createHost); } });
}
const contexts = new WeakMap();
const SCHEMA = 'xtend.xtensions.state-binding-artifact.v8';
function validateManagedStateBindingArtifact(input, program) {
  assertNativeCanonicalData(input); assertNativeCanonicalData(program, true);
  const result = artifactApi._validateArtifactProfile(input, program, life.validateNativeManagedLifecyclePlan, true, true);
  const view = viewApi.validateNativeManagedViewProgram(program);
  const scoped = new Map((view.render.nativeView.scopes || []).map(row => [row.surface, row]));
  for (const entry of result.bindings) {
    const target = scoped.get(entry.surface), owner = scoped.get(entry.ownerSurface);
    const chain = entry.repeat || [], ownerChain = owner?.repeat || [];
    if (JSON.stringify(chain) !== JSON.stringify(target?.repeat || []) || JSON.stringify(entry.presence || null) !== JSON.stringify(target?.presence || null))
      throw new TypeError('Binding8 repeat/presence must match the compiler-owned Surface scope.');
    if (JSON.stringify(chain.slice(0, ownerChain.length)) !== JSON.stringify(ownerChain))
      throw new TypeError('A provider host must share the canonical repeat ancestry of its owning Surface.');
  }
  contexts.set(result, view); return result;
}
function materializeManagedStateBindingArtifact(artifact, snapshot, admission) {
  const program = contexts.get(artifact);
  if (!program || artifact.schema !== SCHEMA) throw new TypeError('Orchestrated materialization requires its validated Artifact8.');
  assertNativeCanonicalData(snapshot, true);
  contract.record(snapshot.states, 'Model states');
  if (admission !== undefined) {
    contract.data(admission); contract.record(admission, 'Surface admission');
    for (const [id, allowed] of Object.entries(admission)) { contract.name(id); if (typeof allowed !== 'boolean') throw new TypeError('Surface admission must contain Boolean values.'); }
  }
  const scopes = scopeApi.materializeNativeSurfaceScopes(program, snapshot);
  const rows = [], addresses = new Set(), hosts = new Set();
  const matching = (surface, keys) => scopes.instances.filter(row => row.surfaceId === surface && row.keys.length <= keys.length && row.keys.every((key, index) => Object.is(key, keys[index]))).sort((a,b) => b.keys.length - a.keys.length)[0];
  for (const entry of artifact.bindings) {
    expandRepeatScopes(entry.repeat, snapshot, keys => {
      const target = matching(entry.surface, keys), owner = matching(entry.ownerSurface, keys);
      if (!target || !owner || admission && [target.id, owner.id].some(id => Object.hasOwn(admission,id) && admission[id] === false)) return;
      if (entry.presence) {
        const visible = contract.readBindingPath(snapshot.states, [entry.presence.state, ...templatePath(entry.presence, entry, keys)]);
        if (typeof visible !== 'boolean') throw new TypeError('Host presence requires a Boolean Model value.');
        if (!visible) return;
      }
      const binding = artifactApi._concreteBinding(entry, keys), key = contract.addressKey(binding.address);
      if (addresses.has(key) || hosts.has(target.id)) throw new TypeError('Orchestrated addresses and host surfaces must be unique.');
      addresses.add(key); hosts.add(target.id); contract.propsFrom(snapshot, binding);
      rows.push({ surface: entry.surface, hostSurface: target.id, ownerSurface: owner.id, binding });
    });
  }
  return contract.freeze(rows);
}
const MANAGED_STATE_BINDING_RUNTIME = Object.freeze({ XTENSION_STATE_BINDING_API_VERSION, XTENSION_MANAGED_STATE_BINDING_API_VERSION, MANAGED_STATE_BINDING_ARTIFACT_SCHEMA,
  validateStateBindingArtifact: validateManagedStateBindingArtifact, validateManagedStateBindingArtifact,
  materializeStateBindingArtifact: materializeManagedStateBindingArtifact, materializeManagedStateBindingArtifact,
  createXTensionStateRegistry: createXTensionManagedStateRegistry, createXTensionManagedStateRegistry });
module.exports = { XTENSION_STATE_BINDING_API_VERSION, XTENSION_MANAGED_STATE_BINDING_API_VERSION, MANAGED_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBindingArtifact: validateManagedStateBindingArtifact, validateManagedStateBindingArtifact, materializeStateBindingArtifact: materializeManagedStateBindingArtifact, materializeManagedStateBindingArtifact, createXTensionStateRegistry: createXTensionManagedStateRegistry, createXTensionManagedStateRegistry, MANAGED_STATE_BINDING_RUNTIME };
