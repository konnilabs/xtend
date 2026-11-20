export const MANAGED_COMPONENT_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v12';
export const MANAGED_COMPONENT_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v13';
// SPDX-License-Identifier: Apache-2.0
// Shared, data-only contract. No framework, filesystem or kernel implementation.
export const ORCHESTRATED_COMPONENT_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v11';
export const ORCHESTRATED_COMPONENT_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v12';
export const LIFECYCLE_COMPONENT_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v10';
export const LIFECYCLE_COMPONENT_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v11';
export const NATIVE_COMPONENT_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v9';
export const NATIVE_COMPONENT_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v10';
export const PROJECTION_COMPONENT_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v8';
export const PROJECTION_COMPONENT_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v9';
export const SCOPED_COMPONENT_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v7';
export const SCOPED_COMPONENT_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v8';
export const COMPONENT_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v6';
export const COMPONENT_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v7';
export const DELIVERY_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v5';
export const DELIVERY_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v6';
export const SHARED_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v4';
export const SHARED_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v5';
export const ORCHESTRATED_LOAD_PLAN_SCHEMA = 'xtend.maraca.xtension-load-plan.v3';
export const SHARED_LOAD_PLAN_SCHEMA = 'xtend.maraca.xtension-load-plan.v2';
export const DEFERRED_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v3';
export const DEFERRED_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v4';
export const LOAD_PLAN_SCHEMA = 'xtend.maraca.xtension-load-plan.v1';
export const GRAPH_MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v2';
export const GRAPH_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v3';
export const MANIFEST_SCHEMA = 'xtend.maraca.xtension-composition-manifest.v1';
export const ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v1';
export const INTEGRATED_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-composition-artifact.v2';
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
  if (!plan || !['xtend.maraca.build-plan.v4', 'xtend.maraca.build-plan.v5', 'xtend.maraca.build-plan.v6', 'xtend.maraca.build-plan.v7','xtend.maraca.build-plan.v8','xtend.maraca.build-plan.v9','xtend.maraca.build-plan.v10','xtend.maraca.build-plan.v11','xtend.maraca.build-plan.v12'].includes(plan.schema) || plan.ok !== true || !/^[a-f0-9]{64}$/.test(plan.sourceHash || '') || !plan.orchestration?.enabled) throw new TypeError('An enabled, valid Maraca v4..v10 build plan is required.');
  if (bindingsRuntime?.XTENSION_STATE_BINDING_API_VERSION !== '2.4.0' || typeof bindingsRuntime.validateStateBindingArtifact !== 'function') throw new TypeError('The explicit state-binding API 2.4 runtime is required.');
  if (plan.schema === 'xtend.maraca.build-plan.v8' && bindingsRuntime.XTENSION_PROJECTION_STATE_BINDING_API_VERSION !== '3.0.0') throw new TypeError('Projection plans require state-binding projection API3.');
  if (plan.schema === 'xtend.maraca.build-plan.v9' && (bindingsRuntime.XTENSION_NATIVE_STATE_BINDING_API_VERSION !== '4.0.0' || typeof bindingsRuntime.createXTensionNativeStateRegistry !== 'function')) throw new TypeError('Native plans require the explicit native state-binding API4.');
  const managed = plan.schema === 'xtend.maraca.build-plan.v12';
  const orchestrated = managed || plan.schema === 'xtend.maraca.build-plan.v11';
  const lifecycle = orchestrated || plan.schema === 'xtend.maraca.build-plan.v10';
  if (managed && (bindingsRuntime.XTENSION_MANAGED_STATE_BINDING_API_VERSION !== '7.0.0' || typeof bindingsRuntime.createXTensionManagedStateRegistry !== 'function' || typeof bindingsRuntime.validateManagedStateBindingArtifact !== 'function')) throw new TypeError('Source8 requires its explicit managed binding API7');
  if (orchestrated && !managed && (bindingsRuntime.XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION !== '6.0.0' || typeof bindingsRuntime.createXTensionOrchestratedStateRegistry !== 'function' || typeof bindingsRuntime.validateOrchestratedStateBindingArtifact !== 'function')) throw new TypeError('Source7 requires the explicit orchestrated binding API6.');
  if (lifecycle && !orchestrated && (bindingsRuntime.XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION !== '5.0.0' || typeof bindingsRuntime.createXTensionLifecycleStateRegistry !== 'function' || typeof bindingsRuntime.validateLifecycleStateBindingArtifact !== 'function')) throw new TypeError('Lifecycle plans require the explicit state-binding API5 and lifecycle validator.');
  const bindings = (managed ? bindingsRuntime.validateManagedStateBindingArtifact : orchestrated ? bindingsRuntime.validateOrchestratedStateBindingArtifact : lifecycle ? bindingsRuntime.validateLifecycleStateBindingArtifact : bindingsRuntime.validateStateBindingArtifact)(plan.xtensionBindings, plan.orchestration.artifact);
  if (!bindings.bindings.length) throw new TypeError('Composition requires at least one binding declaration.');
  const identity = { schema: plan.schema, sourceHash: plan.sourceHash, program: copy(plan.orchestration.artifact), bindings: copy(bindings) };
  if (['xtend.maraca.build-plan.v5', 'xtend.maraca.build-plan.v6', 'xtend.maraca.build-plan.v7','xtend.maraca.build-plan.v8','xtend.maraca.build-plan.v9','xtend.maraca.build-plan.v10','xtend.maraca.build-plan.v11','xtend.maraca.build-plan.v12'].includes(plan.schema)) {
    const composition = plan.xtensionComposition;
    identity.compositionManifest = normalizeManifest([INTEGRATED_ARTIFACT_SCHEMA, GRAPH_ARTIFACT_SCHEMA, DEFERRED_ARTIFACT_SCHEMA, SHARED_ARTIFACT_SCHEMA, DELIVERY_ARTIFACT_SCHEMA, COMPONENT_ARTIFACT_SCHEMA, SCOPED_COMPONENT_ARTIFACT_SCHEMA, PROJECTION_COMPONENT_ARTIFACT_SCHEMA, NATIVE_COMPONENT_ARTIFACT_SCHEMA, LIFECYCLE_COMPONENT_ARTIFACT_SCHEMA, ORCHESTRATED_COMPONENT_ARTIFACT_SCHEMA, MANAGED_COMPONENT_ARTIFACT_SCHEMA].includes(composition?.schema) ? composition.manifest : composition, identity);
  }
  return freeze(identity);
}
export function normalizeManifest(input, identity) {
  json(input); const managed = input?.schema === MANAGED_COMPONENT_MANIFEST_SCHEMA, orchestrated = managed || input?.schema === ORCHESTRATED_COMPONENT_MANIFEST_SCHEMA, lifecycle = orchestrated || input?.schema === LIFECYCLE_COMPONENT_MANIFEST_SCHEMA, native = lifecycle || input?.schema === NATIVE_COMPONENT_MANIFEST_SCHEMA, projected = native || input?.schema === PROJECTION_COMPONENT_MANIFEST_SCHEMA, scoped = projected || input?.schema === SCOPED_COMPONENT_MANIFEST_SCHEMA, component = scoped || input?.schema === COMPONENT_MANIFEST_SCHEMA, delivery = component || input?.schema === DELIVERY_MANIFEST_SCHEMA, shared = delivery || input?.schema === SHARED_MANIFEST_SCHEMA, deferred = shared || input?.schema === DEFERRED_MANIFEST_SCHEMA, graph = deferred || input?.schema === GRAPH_MANIFEST_SCHEMA;
  fields(input, graph ? ['schema', 'providers', 'hosts', 'modules', ...(deferred ? ['loading'] : []), ...(delivery ? ['delivery'] : []), ...(component ? ['interfaces'] : [])] : ['schema', 'providers', 'hosts'], 'composition manifest');
  if (![MANIFEST_SCHEMA, GRAPH_MANIFEST_SCHEMA, DEFERRED_MANIFEST_SCHEMA, SHARED_MANIFEST_SCHEMA, DELIVERY_MANIFEST_SCHEMA, COMPONENT_MANIFEST_SCHEMA, SCOPED_COMPONENT_MANIFEST_SCHEMA, PROJECTION_COMPONENT_MANIFEST_SCHEMA, NATIVE_COMPONENT_MANIFEST_SCHEMA, LIFECYCLE_COMPONENT_MANIFEST_SCHEMA, ORCHESTRATED_COMPONENT_MANIFEST_SCHEMA, MANAGED_COMPONENT_MANIFEST_SCHEMA].includes(input.schema) || !Array.isArray(input.providers) || !input.providers.length || input.providers.length > 64 || !Array.isArray(input.hosts) || input.hosts.length > 256) throw new TypeError('A bounded v1..v10 composition manifest is required.');
  if (component && identity.schema !== undefined && identity.schema !== (managed ? 'xtend.maraca.build-plan.v12' : orchestrated ? 'xtend.maraca.build-plan.v11' : lifecycle ? 'xtend.maraca.build-plan.v10' : native ? 'xtend.maraca.build-plan.v9' : projected ? 'xtend.maraca.build-plan.v8' : scoped ? 'xtend.maraca.build-plan.v7' : 'xtend.maraca.build-plan.v6') || !component && ['xtend.maraca.build-plan.v6','xtend.maraca.build-plan.v7','xtend.maraca.build-plan.v8','xtend.maraca.build-plan.v9','xtend.maraca.build-plan.v10','xtend.maraca.build-plan.v11','xtend.maraca.build-plan.v12'].includes(identity.schema)) throw new TypeError('Component profiles require their matching build-plan v6/v7/v8/v9/v10.');
  if (native && (identity.program?.schema !== (managed ? 'xtend.rmt.app-orchestration.v6' : orchestrated ? 'xtend.rmt.app-orchestration.v5' : lifecycle ? 'xtend.rmt.app-orchestration.v4' : 'xtend.rmt.app-orchestration.v3') || identity.bindings?.schema !== (managed ? 'xtend.xtensions.state-binding-artifact.v8' : orchestrated ? 'xtend.xtensions.state-binding-artifact.v7' : lifecycle ? 'xtend.xtensions.state-binding-artifact.v6' : 'xtend.xtensions.state-binding-artifact.v5'))) throw new TypeError(lifecycle ? 'Lifecycle component manifests require program4 and binding artifact6.' : 'Native component manifests require program3 and binding artifact5.');
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
    fields(host, ['declarationId', 'providerId', 'ownerSurface', 'capabilityRequirements', ...(component ? ['targetSurface', 'interfaceVersion', 'interfaceSha256', 'intents'] : [])], 'host composition');
    name(host.declarationId); name(host.ownerSurface);
    const binding = declarations.get(host.declarationId), provider = providers.find(entry => entry.id === host.providerId);
    if (!binding || !provider || used.has(host.declarationId) || (!component && host.ownerSurface !== binding.surface)) throw new TypeError('Each binding requires one provider and its exact declared owning Surface.');
    if (component) {
      if (host.targetSurface !== binding.surface || !identity.program?.surfaces?.some(surface => surface.id === host.ownerSurface) || !scoped && (binding.repeat || binding.binding.address.keys.length)) throw new TypeError('Component profiles require a declared owner and exact render target; v6 additionally requires a static unkeyed declaration.');
      if (!/^\d+\.\d+\.\d+$/.test(host.interfaceVersion || '') || !digest(host.interfaceSha256)) throw new TypeError('A pinned component interface reference is required.');
      fields(host.intents, Object.keys(binding.binding.intents), 'component intent routes');
    }
    used.add(host.declarationId);
    return { declarationId: host.declarationId, providerId: host.providerId, ownerSurface: host.ownerSurface, capabilityRequirements: requirements(host.capabilityRequirements, provider.framework), ...(component ? { targetSurface: host.targetSurface, interfaceVersion: host.interfaceVersion, interfaceSha256: host.interfaceSha256, intents: copy(host.intents) } : {}) };
  }).sort((a, b) => a.declarationId < b.declarationId ? -1 : 1);
  if (used.size !== declarations.size || providers.some(provider => !hosts.some(host => host.providerId === provider.id))) throw new TypeError('Composition must cover all bindings and use every provider.');
  let modules;
  if (graph) {
    if (!Array.isArray(input.modules) || !input.modules.length || input.modules.length > 256) throw new TypeError('Manifest v2 requires 1..256 pinned local modules.');
    const paths = new Set();
    modules = input.modules.map(row => {
      fields(row, ['module', 'sha256'], 'pinned module');
      if (!localModule(row.module) || paths.has(row.module) || !digest(row.sha256)) throw new TypeError('Pinned modules require unique canonical paths and exact SHA-256.');
      paths.add(row.module); return copy(row);
    }).sort((a, b) => a.module < b.module ? -1 : 1);
    for (const provider of providers) if (!modules.some(row => row.module === provider.entry.module && row.sha256 === provider.integrity.sha256)) throw new TypeError('Every provider entry must match a pinned module.');
  }
  if (deferred) {
    fields(input.loading, ['provider', 'peers'], 'loading policy');
    if (input.loading.provider !== (orchestrated ? 'orchestrated' : 'on-mount') || input.loading.peers !== (shared ? 'shared' : 'per-host')) throw new TypeError('Manifest loading must match its explicit provider/peer version policy.');
  }
  if (delivery) {
    fields(input.delivery, ['schema', 'mode'], 'delivery policy');
    if (input.delivery.schema !== 'xtend.maraca.xtension-delivery-policy.v1' || input.delivery.mode !== 'same-origin-external-esm') throw new TypeError('An explicit same-origin external-ESM delivery policy is required.');
  }
  let interfaces;
  if (component) {
    if (!Array.isArray(input.interfaces) || input.interfaces.length !== providers.length) throw new TypeError('Every component provider requires exactly one pinned interface file.');
    const used = new Set(), paths = new Set();
    interfaces = input.interfaces.map(pin => {
      fields(pin, ['providerId', 'file', 'sha256'], 'component interface pin');
      if (!ids.has(pin.providerId) || used.has(pin.providerId) || paths.has(pin.file) || !/^\.\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.json$/.test(pin.file || '') || !digest(pin.sha256) || hosts.some(host => host.providerId === pin.providerId && host.interfaceSha256 !== pin.sha256)) throw new TypeError('Interface pins must uniquely cover provider IDs and match their host references.');
      used.add(pin.providerId); paths.add(pin.file); return copy(pin);
    }).sort((a,b) => a.providerId < b.providerId ? -1 : 1);
  }
  return freeze({ schema: input.schema, providers, hosts, ...(component ? { interfaces } : {}), ...(graph ? { modules } : {}), ...(deferred ? { loading: copy(input.loading) } : {}), ...(delivery ? { delivery: copy(input.delivery) } : {}) });
}
export function validateArtifact(input, plan, bindingsRuntime) {
  json(input); const managed = input?.schema === MANAGED_COMPONENT_ARTIFACT_SCHEMA, orchestrated = managed || input?.schema === ORCHESTRATED_COMPONENT_ARTIFACT_SCHEMA, lifecycle = orchestrated || input?.schema === LIFECYCLE_COMPONENT_ARTIFACT_SCHEMA, native = lifecycle || input?.schema === NATIVE_COMPONENT_ARTIFACT_SCHEMA, projected = native || input?.schema === PROJECTION_COMPONENT_ARTIFACT_SCHEMA, scoped = projected || input?.schema === SCOPED_COMPONENT_ARTIFACT_SCHEMA, component = scoped || input?.schema === COMPONENT_ARTIFACT_SCHEMA, delivery = component || input?.schema === DELIVERY_ARTIFACT_SCHEMA, shared = delivery || input?.schema === SHARED_ARTIFACT_SCHEMA, deferred = shared || input?.schema === DEFERRED_ARTIFACT_SCHEMA, graph = deferred || input?.schema === GRAPH_ARTIFACT_SCHEMA;
  fields(input, ['schema', 'apiVersion', 'plan', 'manifest', 'providers', 'entryFile', 'runtimeExecutionVerified', ...(graph ? ['modules'] : []), ...(deferred ? ['loadPlan'] : []), ...(component ? ['componentInterfaces'] : [])], 'composition artifact');
  const integrated = input.schema === INTEGRATED_ARTIFACT_SCHEMA;
  if ((!graph && !integrated && input.schema !== ARTIFACT_SCHEMA) || input.apiVersion !== (managed ? '13.0.0' : orchestrated ? '12.0.0' : lifecycle ? '11.0.0' : native ? '10.0.0' : projected ? '9.0.0' : scoped ? '8.0.0' : component ? '7.0.0' : delivery ? '6.0.0' : shared ? '5.0.0' : deferred ? '4.0.0' : graph ? '3.0.0' : integrated ? '2.0.0' : '1.0.0') || !(component ? [managed ? 'xtend.maraca.build-plan.v12' : orchestrated ? 'xtend.maraca.build-plan.v11' : lifecycle ? 'xtend.maraca.build-plan.v10' : native ? 'xtend.maraca.build-plan.v9' : projected ? 'xtend.maraca.build-plan.v8' : scoped ? 'xtend.maraca.build-plan.v7' : 'xtend.maraca.build-plan.v6'] : graph ? ['xtend.maraca.build-plan.v4', 'xtend.maraca.build-plan.v5'] : [integrated ? 'xtend.maraca.build-plan.v5' : 'xtend.maraca.build-plan.v4']).includes(input.plan?.schema) || input.runtimeExecutionVerified !== false || !/^xtend\.xtensions-[a-f0-9]{64}\.mjs$/.test(input.entryFile || '')) throw new TypeError('A version-matched v1..v11 build composition artifact is required.');
  const identity = planIdentity(plan, bindingsRuntime);
  if (canonical(input.plan) !== canonical(identity)) throw new TypeError('Composition artifact belongs to a different compiled source or binding contract.');
  const manifest = normalizeManifest(input.manifest, identity);
  if ((integrated || graph && ['xtend.maraca.build-plan.v5','xtend.maraca.build-plan.v6','xtend.maraca.build-plan.v7','xtend.maraca.build-plan.v8','xtend.maraca.build-plan.v9','xtend.maraca.build-plan.v10','xtend.maraca.build-plan.v11','xtend.maraca.build-plan.v12'].includes(identity.schema)) && canonical(manifest) !== canonical(identity.compositionManifest)) throw new TypeError('The built provider manifest differs from the declared composition.');
  if (!Array.isArray(input.providers) || input.providers.length !== manifest.providers.length) throw new TypeError('Provider build records must match the manifest.');
  const expectedManifest = managed ? MANAGED_COMPONENT_MANIFEST_SCHEMA : orchestrated ? ORCHESTRATED_COMPONENT_MANIFEST_SCHEMA : lifecycle ? LIFECYCLE_COMPONENT_MANIFEST_SCHEMA : native ? NATIVE_COMPONENT_MANIFEST_SCHEMA : projected ? PROJECTION_COMPONENT_MANIFEST_SCHEMA : scoped ? SCOPED_COMPONENT_MANIFEST_SCHEMA
    : component ? COMPONENT_MANIFEST_SCHEMA : delivery ? DELIVERY_MANIFEST_SCHEMA : shared ? SHARED_MANIFEST_SCHEMA : deferred ? DEFERRED_MANIFEST_SCHEMA : graph ? GRAPH_MANIFEST_SCHEMA : MANIFEST_SCHEMA;
  if (manifest.schema !== expectedManifest) throw new TypeError('The artifact and manifest graph versions must agree.');
  if (component) {
    if (!Array.isArray(input.componentInterfaces) || input.componentInterfaces.length !== manifest.interfaces.length) throw new TypeError('Captured component interfaces must cover their pinned manifest.');
    input.componentInterfaces.forEach((row, index) => {
      fields(row, ['definition', 'interfaceSha256', 'moduleSha256', 'sourceBytes', 'fileName'], 'captured component interface');
      const pin = manifest.interfaces[index], provider = manifest.providers.find(p => p.id === pin.providerId);
      if (row.definition?.providerId !== pin.providerId || row.interfaceSha256 !== pin.sha256 || row.moduleSha256 !== provider.integrity.sha256 || !Number.isSafeInteger(row.sourceBytes) || row.sourceBytes < 0 || row.sourceBytes > 65536 || row.fileName !== `interfaces/${pin.providerId}-${pin.sha256}.json`) throw new TypeError('Component interface capture differs from its pinned provider.');
    });
  }
  if (graph) validateModuleGraph(input.modules, manifest);
  input.providers.forEach((entry, index) => {
    fields(entry, ['id', 'sha256', 'fileName', ...(graph ? ['outputSha256'] : [])], 'provider build record');
    const provider = manifest.providers[index];
    if (entry.id !== provider.id || entry.sha256 !== provider.integrity.sha256 || (graph ? !input.modules.some(row => row.module === provider.entry.module && row.fileName === entry.fileName && row.outputSha256 === entry.outputSha256) : entry.fileName !== `providers/${provider.id}-${entry.sha256}.mjs`)) throw new TypeError('Provider build record disagrees with the captured source identity.');
  });
  if (deferred && canonical(input.loadPlan) !== canonical(createLoadPlan(manifest, input.modules, input.providers))) throw new TypeError('The load plan differs from the exact pinned provider/module/peer contract.');
  return freeze({ ...copy(input), plan: identity, manifest });
}

const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export const localModule = value => typeof value === 'string' && /^\.\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:mjs|js)$/.test(value);
/** Explicit relative ESM only: no implicit extensions, package/URL resolution or aliases. */
export function resolveModuleSpecifier(module, specifier) {
  if (typeof specifier !== 'string' || !/^(?:\.\/|(?:\.\.\/)+)(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:mjs|js)$/.test(specifier)) throw new TypeError('Only explicit local relative ESM imports are admitted.');
  const parts = module.slice(2).split('/'); parts.pop();
  for (const part of specifier.split('/')) {
    if (part === '.') continue;
    if (part === '..') { if (!parts.length) throw new TypeError('Module import escapes the project root.'); parts.pop(); }
    else parts.push(part);
  }
  const result = './' + parts.join('/');
  if (!localModule(result)) throw new TypeError('Invalid local module path.');
  return result;
}
export function validateModuleGraph(modules, manifest) {
  if (!Array.isArray(modules) || modules.length !== manifest.modules.length) throw new TypeError('The captured graph must cover the pinned module inventory exactly.');
  const byPath = new Map();
  modules.forEach((row, index) => {
    fields(row, ['module', 'sha256', 'sourceBytes', 'fileName', 'outputSha256', 'outputBytes', 'imports'], 'captured module');
    const pin = manifest.modules[index];
    if (row.module !== pin.module || row.sha256 !== pin.sha256 || !digest(row.outputSha256) || row.fileName !== `providers/modules/${row.module.slice(2)}-${row.outputSha256}.mjs` || !Number.isSafeInteger(row.sourceBytes) || row.sourceBytes < 0 || !Number.isSafeInteger(row.outputBytes) || row.outputBytes < 0 || !Array.isArray(row.imports) || row.imports.length > 256) throw new TypeError('Captured module provenance disagrees with its pinned source.');
    for (const edge of row.imports) {
      fields(edge, ['specifier', 'module'], 'static import');
      if (resolveModuleSpecifier(row.module, edge.specifier) !== edge.module) throw new TypeError('Static import target differs from its canonical local resolution.');
    }
    byPath.set(row.module, row);
  });
  const active = new Set(), visited = new Set();
  function visit(module) {
    if (active.has(module)) throw new TypeError('Cyclic provider module graphs are not admitted.');
    if (visited.has(module)) return;
    const row = byPath.get(module); if (!row) throw new TypeError('Unpinned provider dependency.');
    active.add(module); row.imports.forEach(edge => visit(edge.module)); active.delete(module); visited.add(module);
  }
  manifest.providers.forEach(provider => visit(provider.entry.module));
  if (visited.size !== modules.length) throw new TypeError('Unused pinned modules are not admitted.');
}

/** Pure derivation: executable imports and peer requests cannot add graph members. */
export function createLoadPlan(manifest, modules, providers) {
  const byModule = new Map(modules.map(row => [row.module, row]));
  const shared = [SHARED_MANIFEST_SCHEMA, DELIVERY_MANIFEST_SCHEMA, COMPONENT_MANIFEST_SCHEMA, SCOPED_COMPONENT_MANIFEST_SCHEMA, PROJECTION_COMPONENT_MANIFEST_SCHEMA, NATIVE_COMPONENT_MANIFEST_SCHEMA, LIFECYCLE_COMPONENT_MANIFEST_SCHEMA, ORCHESTRATED_COMPONENT_MANIFEST_SCHEMA, MANAGED_COMPONENT_MANIFEST_SCHEMA].includes(manifest.schema), groups = new Map();
  if (shared) for (const provider of manifest.providers) {
    const key = canonical({ framework: provider.framework, versions: provider.peers });
    if (!groups.has(key)) groups.set(key, { framework: provider.framework, versions: copy(provider.peers), providerIds: [] });
    groups.get(key).providerIds.push(provider.id);
  }
  const peerGroups = [...groups].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, group], index) => ({ id: 'peers-' + index, ...group, providerIds: group.providerIds.sort() }));
  return freeze({ schema: manifest.schema === ORCHESTRATED_COMPONENT_MANIFEST_SCHEMA ? ORCHESTRATED_LOAD_PLAN_SCHEMA : shared ? SHARED_LOAD_PLAN_SCHEMA : LOAD_PLAN_SCHEMA, ...(shared ? { peerGroups } : {}), providers: manifest.providers.map(provider => {
    const reachable = new Set();
    function visit(module) { if (reachable.has(module)) return; reachable.add(module); byModule.get(module).imports.forEach(edge => visit(edge.module)); }
    visit(provider.entry.module);
    return { providerId: provider.id, mode: manifest.schema === ORCHESTRATED_COMPONENT_MANIFEST_SCHEMA ? 'orchestrated' : 'on-mount', phase: manifest.schema === ORCHESTRATED_COMPONENT_MANIFEST_SCHEMA ? 'kernel.fabric.lifecycle' : 'kernel.fabric.mount',
      entryFile: providers.find(row => row.id === provider.id).fileName, exportName: provider.entry.exportName,
      modules: [...reachable].map(module => byModule.get(module).fileName).sort(),
      peers: shared ? { mode: 'shared', groupId: peerGroups.find(group => group.providerIds.includes(provider.id)).id } : { mode: 'per-host', framework: provider.framework, versions: copy(provider.peers) } };
  }) });
}
