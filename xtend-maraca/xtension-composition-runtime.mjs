// SPDX-License-Identifier: Apache-2.0
import { validateArtifact, canonical, freeze, copy, name, json } from './xtension-composition-contract.mjs';
export const XTENSION_COMPOSITION_API_VERSION = '1.0.0';

/** Platform ports and loaded provider namespaces are trusted application inputs.
 * This composer neither fetches executable code nor treats a JSON hash as proof. */
export function createMaracaXTensionHostFactory(options) {
  const artifact = validateArtifact(options.artifact, options.plan, options.bindingsRuntime);
  const providers = new Map(), policies = new Map();
  for (const provider of artifact.manifest.providers) {
    const namespace = options.providers?.[provider.id], adapter = options.adapters?.[provider.framework];
    const create = adapter?.[provider.framework === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter'];
    const normalize = adapter?.[provider.framework === 'react' ? 'normalizeReactPeers' : 'normalizeVuePeers'];
    if (typeof namespace?.[provider.entry.exportName] !== 'function' || typeof create !== 'function' || typeof normalize !== 'function') throw new TypeError('The built provider factory and actual React/Vue adapter ports are required.');
    providers.set(provider.id, { definition: provider, factory: namespace[provider.entry.exportName], create, normalize });
  }
  if (typeof options.loadPeers !== 'function') throw new TypeError('An explicit external-peer loader is required.');
  const loadPeers = options.loadPeers, fabric = options.fabric;
  const kernelWork = Object.freeze({ ...options.kernelWork }), resourceGraph = Object.freeze({ ...options.resourceGraph });
  name(kernelWork.rootId);
  if (!fabric || typeof fabric.createBoundary !== 'function' || !kernelWork.scheduler || !resourceGraph.kernel || !resourceGraph.surfaceGraph || !resourceGraph.surfaceController) throw new TypeError('Shared native Kernel, Fabric and Surface ports are required.');
  for (const host of artifact.manifest.hosts) {
    const grants = options.grants?.[host.declarationId];
    if (!grants || typeof grants !== 'object' || Array.isArray(grants) || ![Object.prototype, null].includes(Object.getPrototypeOf(grants)) || Object.keys(grants).some(key => !['lifecycle', 'work', 'allowedResources', 'workBudget', 'authorize', 'validateProps'].includes(key))) throw new TypeError('Explicit, closed application grants are required for each declaration.');
    for (const callback of ['authorize', 'validateProps']) if (grants[callback] !== undefined && typeof grants[callback] !== 'function') throw new TypeError('Application policy callbacks must be functions when supplied.');
    const configured = { ...(grants.lifecycle === undefined ? {} : { lifecycle: grants.lifecycle }), work: grants.work === undefined ? {} : grants.work,
      allowedResources: grants.allowedResources === undefined ? [] : grants.allowedResources, ...(grants.workBudget === undefined ? {} : { workBudget: grants.workBudget }) };
    json(configured);
    policies.set(host.declarationId, Object.freeze({
      data: freeze(copy(configured)),
      authorize: grants.authorize, validateProps: grants.validateProps
    }));
  }
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
        const loaded = await loadPeers(Object.freeze({ provider: provider.definition, signal }));
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        peers = provider.normalize(loaded);
        for (const [key, version] of Object.entries(provider.definition.peers)) if (peers.versions[key] !== version) throw new TypeError(`External peer ${key} does not match the verified build manifest.`);
        component = provider.factory(Object.freeze(framework === 'react' ? { React: peers.React, ReactDOM: peers.ReactDOM } : { Vue: peers.Vue }));
        if (!component || !['function', 'object'].includes(typeof component) || typeof component.then === 'function') throw new TypeError('Provider factory must synchronously return a precompiled component.');
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        return loaded;
      }
    });
  };
}
