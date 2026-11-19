// SPDX-License-Identifier: Apache-2.0
import { validateArtifact, canonical, freeze, copy, name, json, INTEGRATED_ARTIFACT_SCHEMA, GRAPH_ARTIFACT_SCHEMA, DEFERRED_ARTIFACT_SCHEMA, SHARED_ARTIFACT_SCHEMA, DELIVERY_ARTIFACT_SCHEMA, COMPONENT_ARTIFACT_SCHEMA, SCOPED_COMPONENT_ARTIFACT_SCHEMA, PROJECTION_COMPONENT_ARTIFACT_SCHEMA, NATIVE_COMPONENT_ARTIFACT_SCHEMA, LIFECYCLE_COMPONENT_ARTIFACT_SCHEMA, ORCHESTRATED_COMPONENT_ARTIFACT_SCHEMA } from './xtension-composition-contract.mjs';
import { validateComponentBindings } from './xtension-component-binding.mjs';
export const XTENSION_COMPOSITION_API_VERSION = '13.0.0';
// Shared profile membership is private immutable data; artifact validation still
// establishes the exact plan/manifest/program pair before any runtime work.
const sharedArtifactSchemas = Object.freeze([SHARED_ARTIFACT_SCHEMA, DELIVERY_ARTIFACT_SCHEMA, COMPONENT_ARTIFACT_SCHEMA, SCOPED_COMPONENT_ARTIFACT_SCHEMA, PROJECTION_COMPONENT_ARTIFACT_SCHEMA, NATIVE_COMPONENT_ARTIFACT_SCHEMA, LIFECYCLE_COMPONENT_ARTIFACT_SCHEMA, ORCHESTRATED_COMPONENT_ARTIFACT_SCHEMA]);
const integratedArtifactSchemas = Object.freeze([INTEGRATED_ARTIFACT_SCHEMA, GRAPH_ARTIFACT_SCHEMA, DEFERRED_ARTIFACT_SCHEMA, ...sharedArtifactSchemas]);

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

function capturePeerLoader(options, artifact) {
  const shared = sharedArtifactSchemas.includes(artifact.schema);
  const key = shared ? 'loadPeerGroup' : 'loadPeers', other = shared ? 'loadPeers' : 'loadPeerGroup';
  if (typeof options[key] !== 'function' || options[other] !== undefined) throw new TypeError('Exactly the peer loader port matching the artifact version is required.');
  return { [key]: options[key] };
}
function verifiedPeers(provider, loaded) {
  const peers = provider.normalize(loaded);
  for (const [key, version] of Object.entries(provider.definition.peers)) if (peers.versions[key] !== version) throw new TypeError(`External peer ${key} does not match the verified build manifest.`);
  return peers;
}

/** One factory owns the cache. Subscribers stay attached through mount success.
 * Revocation fences late results even when the trusted loader ignores abort. */
function createSharedPeers(groups, providers, load) {
  const cache = new Map();
  return (provider, signal) => {
    if (signal.aborted) return waitForProvider(Promise.resolve(), signal);
    const group = groups.find(row => row.providerIds.includes(provider.definition.id));
    let entry = cache.get(group.id), start = false;
    if (!entry) {
      start = true;
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      entry = { promise, resolve, reject, controller: new AbortController(), users: new Set() };
      cache.set(group.id, entry);
    }
    const fail = error => {
      if (cache.get(group.id) === entry) cache.delete(group.id);
      entry.controller.abort();
      for (const detach of entry.users) detach();
      entry.reject(error);
    };
    const detach = () => { signal.removeEventListener('abort', cancel); entry.users.delete(detach); };
    const cancel = () => { detach(); if (!entry.users.size) fail(new DOMException('Peer group lifetime was revoked.', 'AbortError')); };
    entry.users.add(detach); signal.addEventListener('abort', cancel, { once: true });
    const pending = waitForProvider(entry.promise, signal);
    if (start) {
      try {
        Promise.resolve(load(Object.freeze({ group, signal: entry.controller.signal }))).then(loaded => {
          if (entry.controller.signal.aborted) return;
          const peers = verifiedPeers(providers.get(group.providerIds[0]), loaded);
          if (!entry.controller.signal.aborted) entry.resolve(Object.freeze(group.framework === 'react' ? { React: peers.React, ReactDOM: peers.ReactDOM, ...(peers.ReactDOMServer ? { ReactDOMServer: peers.ReactDOMServer } : {}) } : { Vue: peers.Vue, ...(peers.VueServerRenderer ? { VueServerRenderer: peers.VueServerRenderer, vueServerRendererVersion: peers.versions.vue } : {}) }));
        }).catch(fail);
      } catch (error) { fail(error); }
    }
    return pending;
  };
}

/** Captures application policy before asynchronous boot. Only Maraca binds the
 * resulting port to its real controller/root and internally created Surfaces. */
export function createMaracaXTensionCompositionPort(options) {
  const artifact = validateArtifact(options.companion?.artifact, options.plan, options.bindingsRuntime);
  if (!integratedArtifactSchemas.includes(artifact.schema) || canonical(artifact) !== canonical(options.plan.xtensionComposition)) throw new TypeError('Integrated boot requires its exact versioned composition artifact.');
  const orchestrated = artifact.schema === ORCHESTRATED_COMPONENT_ARTIFACT_SCHEMA, lifecycle = orchestrated || artifact.schema === LIFECYCLE_COMPONENT_ARTIFACT_SCHEMA, native = lifecycle || artifact.schema === NATIVE_COMPONENT_ARTIFACT_SCHEMA, projected = native || artifact.schema === PROJECTION_COMPONENT_ARTIFACT_SCHEMA, scoped = projected || artifact.schema === SCOPED_COMPONENT_ARTIFACT_SCHEMA, component = scoped || artifact.schema === COMPONENT_ARTIFACT_SCHEMA;
  if (projected && options.ssr !== undefined) throw new TypeError(native ? 'Source5 has no SSR/adoption acceptance contract.' : 'Source4 has no SSR/adoption acceptance contract.');
  if (component && !scoped && options.ssr !== undefined) throw new TypeError('Component ownership v7 requires a separate A05 SSR handoff.');
  const componentInterfaceRuntime = component ? Object.freeze({ ...options.componentInterfaceRuntime }) : null;
  if (component) validateComponentBindings(artifact, componentInterfaceRuntime);
  const createHostFactory = options.companion.createHostFactory;
  if (typeof createHostFactory !== 'function') throw new TypeError('The built companion and explicit peer loader are required.');
  const loaders = capturePeerLoader(options, artifact);
  const policies = capturePolicies(artifact.manifest.hosts, options.grants);
  const grants = Object.freeze(Object.fromEntries([...policies].map(([id, policy]) => [id, Object.freeze({ ...policy.data, authorize: policy.authorize, validateProps: policy.validateProps })])));
  const adapters = Object.freeze(Object.fromEntries(Object.entries(options.adapters || {}).map(([id, api]) => [id, Object.freeze({ ...api })])));
  const plan = freeze(copy(options.plan)), bindingsRuntime = options.bindingsRuntime;
  const ssrSession = options.ssr === undefined ? null : options.ssrRuntime.createMaracaXTensionSSRSession({ artifact, bindingsRuntime, resumeBindingsRuntime: options.resumeBindingsRuntime, options: options.ssr, ...(scoped ? { componentInterfaceRuntime } : {}) });
  return Object.freeze({ schema: orchestrated ? 'xtend.maraca.xtension-composition-port.v9' : lifecycle ? 'xtend.maraca.xtension-composition-port.v8' : native ? 'xtend.maraca.xtension-composition-port.v7' : projected ? 'xtend.maraca.xtension-composition-port.v6' : scoped ? ssrSession ? 'xtend.maraca.xtension-composition-port.v5' : 'xtend.maraca.xtension-composition-port.v4' : component ? 'xtend.maraca.xtension-composition-port.v3' : ssrSession ? 'xtend.maraca.xtension-composition-port.v2' : 'xtend.maraca.xtension-composition-port.v1', bindingsRuntime, ...(ssrSession ? { ssrSession, resumeBindingsRuntime: options.resumeBindingsRuntime } : {}),
    bind(ports) {
      validateArtifact(artifact, ports.plan, bindingsRuntime);
      return createHostFactory({ ...ports, plan, bindingsRuntime, adapters, ...(component ? { componentInterfaceRuntime } : {}), ...loaders, grants, ...(ssrSession ? { ssrSession } : {}),
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
  const shared = sharedArtifactSchemas.includes(artifact.schema), deferred = shared || artifact.schema === DEFERRED_ARTIFACT_SCHEMA;
  if ((deferred && options.providers !== undefined) || (!deferred && options.loadProviders !== undefined)) throw new TypeError('Provider namespace/loader ports must match the artifact version.');
  const orchestrated = artifact.schema === ORCHESTRATED_COMPONENT_ARTIFACT_SCHEMA, lifecycle = orchestrated || artifact.schema === LIFECYCLE_COMPONENT_ARTIFACT_SCHEMA, native = lifecycle || artifact.schema === NATIVE_COMPONENT_ARTIFACT_SCHEMA, projected = native || artifact.schema === PROJECTION_COMPONENT_ARTIFACT_SCHEMA, scoped = projected || artifact.schema === SCOPED_COMPONENT_ARTIFACT_SCHEMA, componentProfile = scoped || artifact.schema === COMPONENT_ARTIFACT_SCHEMA;
  if (projected && options.ssrSession) throw new TypeError(native ? 'Source5 cannot use legacy SSR sessions.' : 'Source4 cannot use legacy SSR sessions.');
  if (componentProfile && !scoped && options.ssrSession) throw new TypeError('Component ownership v7 requires a separate A05 SSR handoff.');
  const componentInterfaceRuntime = componentProfile ? Object.freeze({ ...options.componentInterfaceRuntime }) : null;
  const components = componentProfile ? validateComponentBindings(artifact, componentInterfaceRuntime) : null;
  const loaders = capturePeerLoader(options, artifact), providerLoads = new Map();
  const providers = new Map(), policies = capturePolicies(artifact.manifest.hosts, options.grants);
  for (const provider of artifact.manifest.providers) {
    const namespace = options.providers?.[provider.id], adapter = options.adapters?.[provider.framework];
    const create = adapter?.[options.ssrSession ? provider.framework === 'react' ? 'createReactSSRRuntimeAdapter' : 'createVueSSRRuntimeAdapter' : provider.framework === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter'];
    const normalize = adapter?.[options.ssrSession?.mode === 'server' ? provider.framework === 'react' ? 'normalizeReactSSRPeers' : 'normalizeVueSSRPeers' : provider.framework === 'react' ? 'normalizeReactPeers' : 'normalizeVuePeers'];
    const loadProvider = options.loadProviders?.[provider.id];
    if ((deferred ? typeof loadProvider !== 'function' : typeof namespace?.[provider.entry.exportName] !== 'function') || typeof create !== 'function' || typeof normalize !== 'function') throw new TypeError('The built provider factory and actual React/Vue adapter ports are required.');
    providers.set(provider.id, { definition: provider, factory: namespace?.[provider.entry.exportName], loadProvider, create, normalize });
  }
  const loadPeers = shared ? createSharedPeers(artifact.loadPlan.peerGroups, providers, loaders.loadPeerGroup) : loaders.loadPeers, fabric = options.fabric;
  if (scoped && typeof options.resolveHostBinding !== 'function') throw new TypeError('Scoped components require the live Maraca materialization port.');
  const resolveHostBinding = options.resolveHostBinding;
  const kernelWork = Object.freeze({ ...options.kernelWork }), resourceGraph = Object.freeze({ ...options.resourceGraph });
  name(kernelWork.rootId);
  if (!fabric || typeof fabric.createBoundary !== 'function' || !kernelWork.scheduler || !resourceGraph.kernel || !resourceGraph.surfaceGraph || !resourceGraph.surfaceController) throw new TypeError('Shared native Kernel, Fabric and Surface ports are required.');
  async function loadProviderFactory(provider, signal) {
    if (!deferred) return provider.factory;
    if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
    let pending = providerLoads.get(provider.definition.id);
    if (!pending) {
      let resolveLoad, rejectLoad;
      pending = new Promise((resolve, reject) => { resolveLoad = resolve; rejectLoad = reject; });
      providerLoads.set(provider.definition.id, pending);
      try {
        Promise.resolve(provider.loadProvider()).then(namespace => {
          const factory = namespace?.[provider.definition.entry.exportName];
          if (typeof factory !== 'function') throw new TypeError('Loaded provider namespace lacks its declared factory export.');
          return factory;
        }).then(resolveLoad, rejectLoad);
      } catch (error) { rejectLoad(error); }
      pending.catch(() => { if (providerLoads.get(provider.definition.id) === pending) providerLoads.delete(provider.definition.id); });
    }
    return waitForProvider(pending, signal);
  }
  const createHost = function createXTensionHost(context) {
    const declarationId = context.identity?.address?.declarationId;
    const definition = artifact.manifest.hosts.find(entry => entry.declarationId === declarationId);
    const binding = artifact.plan.bindings.bindings.find(entry => entry.binding.address.declarationId === declarationId);
    const events = Object.fromEntries(Object.entries(binding?.binding.intents || {}).map(([key, value]) => [key, value.payloadSchema]));
    if (!definition || context.identity.address.documentId !== artifact.plan.bindings.documentId || context.surface !== binding.surface || context.binding?.address && canonical(context.binding.address) !== canonical(context.identity.address) || canonical(context.events) !== canonical(events) || typeof context.onEvent !== 'function') throw new TypeError('Only the matching registry/Maraca binding context may select a composed host.');
    const componentContract = components?.get(declarationId);
    const concrete = scoped ? resolveHostBinding(context.identity.address) : binding;
    if (scoped && (!concrete || concrete.surface !== definition.targetSurface || concrete.hostSurface !== context.hostSurface)) throw new TypeError('The concrete component host is absent from the live Model materialization.');
    if (componentContract && canonical(context.binding) !== canonical(concrete.binding)) throw new TypeError('Concrete component binding differs from the captured declaration.');
    name(context.xtensionId); name(context.hostId); name(context.surfaceId);
    const provider = providers.get(definition.providerId), grants = policies.get(declarationId), framework = provider.definition.framework;
    let component, peers;
    // The component factory is invoked by loadRuntime *inside* the existing
    // admitted native mount job and its Fabric boundary, never by this factory.
    const proxy = framework === 'react'
      ? function ComposedReactHost(props) { return peers.React.createElement(component, props); }
      : { inheritAttrs: false, setup(_props, { attrs }) { return () => peers.Vue.h(component, { ...attrs }); } };
    const normalizeEvent = componentContract ? event => {
      const route = Object.hasOwn(componentContract.resolved.routes,event.event) && componentContract.resolved.routes[event.event];
      if (!route || event.payloadSchema !== route.payloadSchema) throw new TypeError('Unknown captured component intent.');
      return { ...event, payload: (projected ? componentInterfaceRuntime.mapProjectedComponentIntent : componentInterfaceRuntime.mapComponentIntent)(componentContract.definition, event.event, event.payload, route.payload) };
    } : event => event;
    const onEvent = scoped && options.ssrSession ? options.ssrSession.gate(context,normalizeEvent)
      : options.ssrSession ? options.ssrSession.gate(context) : event => context.onEvent(normalizeEvent(event));
    return provider.create({ container: context.container, hostId: context.hostId, surfaceId: context.surfaceId, xtensionId: context.xtensionId,
      onEvent, component: proxy, fabric,
      ...(options.ssrSession ? { ssr: options.ssrSession.hostContext(context, provider.definition) } : {}),
      kernelWork: { scheduler: kernelWork.scheduler, rootId: kernelWork.rootId, scope: context.xtensionId, ...(Object.hasOwn(grants.data, 'lifecycle') ? { lifecycle: grants.data.lifecycle } : {}), work: grants.data.work },
      resourceGraph: { ...resourceGraph, surfaceId: orchestrated ? concrete.ownerSurface : definition.ownerSurface },
      ...(Object.hasOwn(grants.data, 'workBudget') ? { workBudget: grants.data.workBudget } : {}),
      policy: { events, allowedResources: grants.data.allowedResources, authorize: grants.authorize, validateProps: componentContract ? props => { componentInterfaceRuntime.assertComponentProps(componentContract.definition, props); return grants.validateProps ? grants.validateProps(props) : true; } : grants.validateProps },
      capabilityRequirements: definition.capabilityRequirements, expectedVersions: provider.definition.peers,
      async loadRuntime({ signal }) {
        const factory = deferred ? await loadProviderFactory(provider, signal) : provider.factory;
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        const loaded = await (shared ? loadPeers(provider, signal) : loadPeers(Object.freeze({ provider: provider.definition, signal })));
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        peers = verifiedPeers(provider, loaded);
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        const interfaceContext = componentContract ? { componentInterface: componentContract.definition } : {};
        component = factory(Object.freeze(framework === 'react' ? { ...interfaceContext, React: peers.React, ReactDOM: peers.ReactDOM, ...(peers.ReactDOMServer ? { ReactDOMServer: peers.ReactDOMServer } : {}) } : { ...interfaceContext, Vue: peers.Vue, ...(peers.VueServerRenderer ? { VueServerRenderer: peers.VueServerRenderer, vueServerRendererVersion: peers.versions.vue } : {}) }));
        if (options.ssrSession && framework === 'vue' && [component, component?.setup].some(value => typeof value === 'function' && value.constructor?.name === 'AsyncFunction')) throw new TypeError('SSR v1 requires synchronous Vue root components.');
        if (!component || !['function', 'object'].includes(typeof component) || typeof component.then === 'function') throw new TypeError('Provider factory must synchronously return a precompiled component.');
        if (signal.aborted) throw new DOMException('Provider lifetime was revoked.', 'AbortError');
        return loaded;
      }
    });
  };
  if (orchestrated) Object.defineProperty(createHost, 'prewarm', { value: async request => {
    const { surfaceIds, signal } = request || {};
    if (!Array.isArray(surfaceIds) || !signal || typeof signal.addEventListener !== 'function') throw new TypeError('Prewarm requires explicit declaration surfaces and an admitted work signal.');
    surfaceIds.forEach(name);
    const known = new Set(artifact.plan.program.surfaces.map(row => row.id));
    if (surfaceIds.some(id => !known.has(id))) throw new TypeError('Prewarm cannot nominate an unknown Surface declaration.');
    if (signal.aborted) throw new DOMException('Prewarm authority was revoked.', 'AbortError');
    const ids = new Set(artifact.manifest.hosts.filter(host => surfaceIds.includes(host.ownerSurface) || surfaceIds.includes(host.targetSurface)).map(host => host.providerId));
    await Promise.all([...ids].map(async id => {
      const provider = providers.get(id);
      await loadProviderFactory(provider, signal);
      if (signal.aborted) throw new DOMException('Prewarm authority was revoked.', 'AbortError');
      const loaded = await (shared ? loadPeers(provider, signal) : loadPeers(Object.freeze({ provider: provider.definition, signal })));
      verifiedPeers(provider, loaded);
      if (signal.aborted) throw new DOMException('Prewarm authority was revoked.', 'AbortError');
    }));
    return freeze({ providerIds: [...ids].sort(), mounted: false });
  } });
  return createHost;
}
