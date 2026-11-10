// SPDX-License-Identifier: Apache-2.0
// Shared, data-only contract. No framework, filesystem or kernel implementation.
export const MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v1';
export const ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v1';
const unsafe = new Set(['__proto__', 'prototype', 'constructor']);
export function json(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return;
  if (!value || typeof value !== 'object' || seen.has(value) || !Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError('Composition data must be finite, acyclic, plain JSON.');
  seen.add(value);
  const keys = Reflect.ownKeys(value);
  if (Array.isArray(value) && keys.length !== value.length + 1) throw new TypeError('Composition arrays must be dense.');
  for (const key of keys) {
    if (Array.isArray(value) && key === 'length') continue;
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || unsafe.has(key) || !d.enumerable || !('value' in d) || Array.isArray(value) && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)) throw new TypeError('Unsafe composition data key or accessor.');
    json(d.value, seen);
  }
  seen.delete(value);
}
export function fields(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new TypeError(`Invalid ${label} fields.`);
}
export function name(value) {
  if (typeof value !== 'string' || !value || value.trim() !== value || unsafe.has(value)) throw new TypeError('A safe composition name is required.');
}
export function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export const copy = value => JSON.parse(JSON.stringify(value));
export const canonical = value => JSON.stringify(sort(value));
function sort(value) {
  return Array.isArray(value) ? value.map(sort) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])])) : value;
}
const features = ['kernel.lifecycle', 'fabric.boundary', 'props.controlled', 'work.named', 'resources.cooperative', 'cancellation.cooperative', 'surface.lifecycle', 'work.bounded', 'work.pressure-budgets', 'framework.internal-scheduling', 'execution.preemption', 'render.ssr', 'render.adoption'];
function requirements(value, framework) {
  fields(value, ['schema', 'framework', 'required', 'optional'], 'capability requirements');
  if (value.schema !== 'xtend.xtensions.host-capability-requirements.v1' || value.framework !== undefined && value.framework !== framework) throw new TypeError('Provider and capability requirement framework must agree.');
  const result = { schema: value.schema, framework };
  for (const section of ['required', 'optional']) {
    const request = section === 'optional' && value[section] === undefined ? {} : value[section];
    fields(request, ['features', 'work', 'resources', 'events'], 'capability requests');
    result[section] = {};
    for (const key of ['features', 'work', 'resources', 'events']) {
      const entries = request[key] === undefined ? [] : request[key];
      if (!Array.isArray(entries) || entries.length > (key === 'work' ? 32 : 64) || new Set(entries).size !== entries.length) throw new TypeError('Capability requests require bounded, unique arrays.');
      entries.forEach(name);
      if (key === 'features' && entries.some(entry => !features.includes(entry))) throw new TypeError('Unknown capability feature.');
      if (section === 'optional' && entries.some(entry => result.required[key].includes(entry))) throw new TypeError('Required and optional requests must be disjoint.');
      result[section][key] = [...entries].sort();
    }
  }
  return result;
}
export function planIdentity(plan, bindingsRuntime) {
  if (!plan || plan.schema !== 'xtend.maraca.build-plan.v4' || plan.ok !== true || !/^[a-f0-9]{64}$/.test(plan.sourceHash || '') || !plan.orchestration?.enabled) throw new TypeError('An enabled, valid Maraca v4 build plan is required.');
  if (bindingsRuntime?.XTENSION_STATE_BINDING_API_VERSION !== '2.4.0' || typeof bindingsRuntime.validateStateBindingArtifact !== 'function') throw new TypeError('The explicit state-binding API 2.4 runtime is required.');
  const bindings = bindingsRuntime.validateStateBindingArtifact(plan.xtensionBindings, plan.orchestration.artifact);
  if (!bindings.bindings.length) throw new TypeError('Composition requires at least one binding declaration.');
  return freeze({ schema: plan.schema, sourceHash: plan.sourceHash, program: copy(plan.orchestration.artifact), bindings: copy(bindings) });
}
export function normalizeManifest(input, identity) {
  json(input); fields(input, ['schema', 'providers', 'hosts'], 'composition manifest');
  if (input.schema !== MANIFEST_SCHEMA || !Array.isArray(input.providers) || !input.providers.length || input.providers.length > 64 || !Array.isArray(input.hosts) || input.hosts.length > 256) throw new TypeError('A bounded v1 composition manifest is required.');
  const ids = new Set();
  const providers = input.providers.map(provider => {
    fields(provider, ['id', 'framework', 'version', 'entry', 'integrity', 'peers'], 'provider');
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(provider.id || '') || ids.has(provider.id)) throw new TypeError('Provider IDs must be unique path-safe names.');
    ids.add(provider.id);
    if (!['react', 'vue'].includes(provider.framework) || !/^\d+\.\d+\.\d+$/.test(provider.version || '')) throw new TypeError('Only explicitly versioned React/Vue component factories are supported.');
    fields(provider.entry, ['module', 'exportName'], 'provider entry');
    if (typeof provider.entry.module !== 'string' || !/^\.\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:mjs|js)$/.test(provider.entry.module) || !/^[a-zA-Z_$][\w$]*$/.test(provider.entry.exportName || '')) throw new TypeError('A local ESM file and named factory export are required.');
    fields(provider.integrity, ['sha256'], 'provider integrity');
    if (!/^[a-f0-9]{64}$/.test(provider.integrity.sha256 || '')) throw new TypeError('Exact provider SHA-256 is required.');
    const peers = provider.framework === 'react' ? ['react', 'react-dom'] : ['vue'];
    fields(provider.peers, peers, 'external peers');
    if (Object.keys(provider.peers).length !== peers.length || peers.some(key => !(provider.framework === 'react' ? /^(18|19)\.\d+\.\d+$/ : /^3\.\d+\.\d+$/).test(provider.peers[key])) || provider.framework === 'react' && provider.peers.react !== provider.peers['react-dom']) throw new TypeError('Exact, matching, supported external peer versions are required.');
    return copy(provider);
  }).sort((a, b) => a.id < b.id ? -1 : 1);
  const declarations = new Map(identity.bindings.bindings.map(entry => [entry.binding.address.declarationId, entry]));
  if (declarations.size !== identity.bindings.bindings.length) throw new TypeError('Declaration IDs must uniquely identify composition entries.');
  const used = new Set(), hosts = input.hosts.map(host => {
    fields(host, ['declarationId', 'providerId', 'ownerSurface', 'capabilityRequirements'], 'host composition');
    name(host.declarationId); name(host.ownerSurface);
    const binding = declarations.get(host.declarationId), provider = providers.find(entry => entry.id === host.providerId);
    if (!binding || !provider || used.has(host.declarationId) || host.ownerSurface !== binding.surface) throw new TypeError('Each binding requires one provider and its exact declared owning Surface.');
    used.add(host.declarationId);
    return { declarationId: host.declarationId, providerId: host.providerId, ownerSurface: host.ownerSurface, capabilityRequirements: requirements(host.capabilityRequirements, provider.framework) };
  }).sort((a, b) => a.declarationId < b.declarationId ? -1 : 1);
  if (used.size !== declarations.size || providers.some(provider => !hosts.some(host => host.providerId === provider.id))) throw new TypeError('Composition must cover all bindings and use every provider.');
  return freeze({ schema: MANIFEST_SCHEMA, providers, hosts });
}
export function validateArtifact(input, plan, bindingsRuntime) {
  json(input); fields(input, ['schema', 'apiVersion', 'plan', 'manifest', 'providers', 'entryFile', 'runtimeExecutionVerified'], 'composition artifact');
  if (input.schema !== ARTIFACT_SCHEMA || input.apiVersion !== '1.0.0' || input.runtimeExecutionVerified !== false || !/^xtend\.xtensions-[a-f0-9]{64}\.mjs$/.test(input.entryFile || '')) throw new TypeError('A v1 build composition artifact is required.');
  const identity = planIdentity(plan, bindingsRuntime);
  if (canonical(input.plan) !== canonical(identity)) throw new TypeError('Composition artifact belongs to a different compiled source or binding contract.');
  const manifest = normalizeManifest(input.manifest, identity);
  if (!Array.isArray(input.providers) || input.providers.length !== manifest.providers.length) throw new TypeError('Provider build records must match the manifest.');
  input.providers.forEach((entry, index) => {
    fields(entry, ['id', 'sha256', 'fileName'], 'provider build record');
    const provider = manifest.providers[index];
    if (entry.id !== provider.id || entry.sha256 !== provider.integrity.sha256 || entry.fileName !== `providers/${provider.id}-${entry.sha256}.mjs`) throw new TypeError('Provider build record disagrees with the captured source identity.');
  });
  return freeze({ ...copy(input), plan: identity, manifest });
}
