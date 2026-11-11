// SPDX-License-Identifier: Apache-2.0
import { validateArtifact, canonical, freeze, copy, name, json } from './xtension-composition-contract.mjs';
export const XTENSION_COMPOSITION_API_VERSION = '4.0.0';

function capturePolicies(hosts, input) {
  const policies = new Map();
  for (const host of hosts) {
    const grants = input?.[host.declarationId];
    if (!grants || typeof grants !== 'object' || Array.isArray(grants) || ![Object.prototype, null].includes(Object.getPrototypeOf(grants)) || Object.keys(grants).some(key => !['lifecycle', 'work', 'allowedResources', 'workBudget', 'authorize', 'validateProps'].includes(key))) throw new TypeError('Explicit, closed application grants are required for each declaration.');
    for (const callback of ['authorize', 'validateProps']) if (grants[callback] !== undefined && typeof grants[callback] !== 'function') throw new TypeError('Application policy callbacks must be functions when supplied.');
    const configured = { ...(grants.lifecycle === undefined ? {} : { lifecycle: grants.lifecycle }), work: grants.work === undefined ? {} : grants.work,
      allowedResources: grants.allowedResources === undefined ? [] : grants.allowedResources, ...(grants.workBudget === undefined ? {} : { workBudget: grants.workBudget }) };
    json(configured);
    policies.set(host.declarationId, Object.freeze({ data: freeze(copy(configured)), authorize: grants.authorize, validateProps: grants.validateProps }));
  }
  return policies;
}

/** Captures application policy before asynchronous boot. Only Maraca binds the
 * resulting port to its real controller/root and internally created Surfaces. */
export function createMaracaXTensionCompositionPort(options) {
  const artifact = validateArtifact(options.companion?.artifact, options.plan, options.bindingsRuntime);
  if (!['xtend.maraca.xtension-composition-artifact.v2', 'xtend.maraca.xtension-composition-artifact.v3', 'xtend.maraca.xtension-composition-artifact.v4'].includes(artifact.schema) || canonical(artifact) !== canonical(options.plan.xtensionComposition)) throw new TypeError('Integrated boot requires the exact built v2/v3/v4 composition artifact.');
  const createHostFactory = options.companion.createHostFactory;
  if (typeof createHostFactory !== 'function' || typeof options.loadPeers !== 'function') throw new TypeError('The built companion and explicit peer loader are required.');
  const policies = capturePolicies(artifact.manifest.hosts, options.grants);
  const grants = Object.freeze(Object.fromEntries([...policies].map(([id, policy]) => [id, Object.freeze({ ...policy.data, authorize: policy.authorize, validateProps: policy.validateProps })])));
  const adapters = Object.freeze(Object.fromEntries(Object.entries(options.adapters || {}).map(([id, api]) => [id, Object.freeze({ ...api })])));
  const plan = freeze(copy(options.plan)), bindingsRuntime = options.bindingsRuntime, loadPeers = options.loadPeers;
  return Object.freeze({ schema: 'xtend.maraca.xtension-composition-port.v1', bindingsRuntime,
    bind(ports) {
      validateArtifact(artifact, ports.plan, bindingsRuntime);
      return createHostFactory({ ...ports, plan, bindingsRuntime, adapters, loadPeers, grants,
        compositionRuntime: Object.freeze({ createMaracaXTensionHostFactory }) });
    }
  });
}

/** Native import cannot be cancelled. Revoke this waiter without cancelling a
 * sibling's shared import, and fence every continuation before peers/factories. */
function waitForProvider(promise, signal) {
  if (signal.aborted) return Promise.reject(new DOMException('Provider lifetime was revoked.', 'AbortError'));
  return new Promise((resolve, reject) => {
    const cancel = () => { signal.removeEventListener('abort', cancel); reject(new DOMException('Provider lifetime was revoked.', 'AbortError')); };
    signal.addEventListener('abort', cancel, { once: true });
    promise.then(value => { signal.removeEventListener('abort', cancel); if (signal.aborted) cancel(); else resolve(value); }, error => { signal.removeEventListener('abort', cancel); reject(error); });
  });
}

/** Platform ports and loaded provider namespaces are trusted application inputs.
 * This composer neither fetches executable code nor treats a JSON hash as proof. */
export function createMaracaXTensionHostFactory(options) {
  const artifact = validateArtifact(options.artifact, options.plan, options.bindingsRuntime);
  const deferred = artifact.schema === 'xtend.maraca.xtension-composition-artifact.v4';
  if ((deferred && options.providers !== undefined) || (!deferred && options.loadProviders !== undefined)) throw new TypeError('Provider namespace/loader ports must match the artifact version.');
  const providerLoads = new Map();
  const providers = new Map(), policies = capturePolicies(artifact.manifest.hosts, options.grants);
  for (const provider of artifact.manifest.providers) {
    const namespace = options.providers?.[provider.id], adapter = options.adapters?.[provider.framework];
    const create = adapter?.[provider.framework === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter'];
    const normalize = adapter?.[provider.framework === 'react' ? 'normalizeReactPeers' : 'normalizeVuePeers'];
    const loadProvider = options.loadProviders?.[provider.id];
    if ((deferred ? typeof loadProvider !== 'function' : typeof namespace?.[provider.entry.exportName] !== 'function') || typeof create !== 'function' || typeof normalize !== 'function') throw new TypeError('The built provider factory and actual React/Vue adapter ports are required.');
    providers.set(provider.id, { definition: provider, factory: namespace?.[provider.entry.exportName], loadProvider, create, normalize });
  }
  if (typeof options.loadPeers !== 'function') throw new TypeError('An explicit external-peer loader is required.');
  const loadPeers = options.loadPeers, fabric = options.fabric;
  const kernelWork = Object.freeze({ ...options.kernelWork }), resourceGraph = Object.freeze({ ...options.resourceGraph });
  name(kernelWork.rootId);
  if (!fabric || typeof fabric.createBoundary !== 'function' || !kernelWork.scheduler || !resourceGraph.kernel || !resourceGraph.surfaceGraph || !resourceGraph.surfaceController) throw new TypeError('Shared native Kernel, Fabric and Surface ports are required.');
  return function createXTensionHost(context) {
    const declarationId = context.identity?.address?.declarationId;
    const definition = artifact.manifest.hosts.find(entry => entry.declarationId === declarationId);
    const binding = artifact.plan.bindings.bindings.find(entry => entry.binding.address.declarationId === declarationId);
    const events = Object.fromEntries(Object.entries(binding?.binding.intents || {}).map(([key, value]) => [key, value.payloadSchema]));
    if (!definition || context.identity.address.documentId !== artifact.plan.bindings.documentId || context.surface !== binding.surface || context.binding?.address && canonical(context.binding.address) !== canonical(context.identity.address) || canonical(context.events) !== canonical(events) || typeof context.onEvent !== 'function') throw new TypeError('Only the matching registry/Maraca binding context may select a composed host.');
    name(context.xtensionId); name(context.hostId); name(context.surfaceId);
    const provider = providers.get(definition.providerId), grants = policies.get(declarationId), framework = provider.definition.framework;
    let component, peers;
    // The component factory is invoked by loadRuntime *inside* the existing
    // admitted native mount job and its Fabric boundary, never by this factory.
    const proxy = framework === 'react'
      ? function ComposedReactHost(props) { return peers.React.createElement(component, props); }
      : { inheritAttrs: false, setup(_props, { attrs }) { return () => peers.Vue.h(component, { ...attrs }); } };
    return provider.create({ container: context.container, hostId: context.hostId, surfaceId: context.surfaceId, xtensionId: context.xtensionId,
      onEvent: context.onEvent, component: proxy, fabric,
      kernelWork: { scheduler: kernelWork.scheduler, rootId: kernelWork.rootId, scope: context.xtensionId, ...(Object.hasOwn(grants.data, 'lifecycle') ? { lifecycle: grants.data.lifecycle } : {}), work: grants.data.work },
      resourceGraph: { ...resourceGraph, surfaceId: definition.ownerSurface },
      ...(Object.hasOwn(grants.data, 'workBudget') ? { workBudget: grants.data.workBudget } : {}),
      policy: { events, allowedResources: grants.data.allowedResources, authorize: grants.authorize, validateProps: grants.validateProps },
      capabilityRequirements: definition.capabilityRequirements, expectedVersions: provider.definition.peers,
      async loadRuntime({ signal }) {
        let factory = provider.factory;
        if (deferred) {
          if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
          let pending = providerLoads.get(provider.definition.id);
          if (!pending) {
            let resolveLoad, rejectLoad;
            pending = new Promise((resolve, reject) => { resolveLoad = resolve; rejectLoad = reject; });
            providerLoads.set(provider.definition.id, pending);
            // Start the literal import synchronously in the admitted callback.
            // Install the shared promise first, including for trusted reentry.
            try {
              Promise.resolve(provider.loadProvider()).then(namespace => {
                const value = namespace?.[provider.definition.entry.exportName];
                if (typeof value !== 'function') throw new TypeError('Loaded provider namespace lacks its declared factory export.');
                return value;
              }).then(resolveLoad, rejectLoad);
            } catch (error) { rejectLoad(error); }
            pending.catch(() => { if (providerLoads.get(provider.definition.id) === pending) providerLoads.delete(provider.definition.id); });
          }
          factory = await waitForProvider(pending, signal);
        }
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        const loaded = await loadPeers(Object.freeze({ provider: provider.definition, signal }));
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        peers = provider.normalize(loaded);
        for (const [key, version] of Object.entries(provider.definition.peers)) if (peers.versions[key] !== version) throw new TypeError(`External peer ${key} does not match the verified build manifest.`);
        component = factory(Object.freeze(framework === 'react' ? { React: peers.React, ReactDOM: peers.ReactDOM } : { Vue: peers.Vue }));
        if (!component || !['function', 'object'].includes(typeof component) || typeof component.then === 'function') throw new TypeError('Provider factory must synchronously return a precompiled component.');
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        return loaded;
      }
    });
  };
}
