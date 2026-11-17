// SPDX-License-Identifier: Apache-2.0
import { canonical } from './xtension-composition-contract.mjs';
/** Re-derive controlled data from the independently captured provider contract.
 * Compiled/captured artifacts are trusted host inputs, not arbitrary JSON grants. */
export function validateComponentBindings(artifact, api) {
  const projected = artifact.schema === 'xtend.maraca.xtension-composition-artifact.v9';
  if (projected ? api?.COMPONENT_INTERFACE_API_VERSION !== '2.0.0' : !['1.0.0','2.0.0'].includes(api?.COMPONENT_INTERFACE_API_VERSION)) throw new TypeError('A matching component interface runtime API is required.');
  const catalog = api.createComponentInterfaceCatalog(artifact.componentInterfaces.map(({ definition, interfaceSha256, moduleSha256 }) => ({ definition, interfaceSha256, moduleSha256 })));
  const bindings = new Map();
  for (const host of artifact.manifest.hosts) {
    const provider = artifact.manifest.providers.find(row => row.id === host.providerId);
    const { definition } = catalog.resolve({ providerId: host.providerId, interfaceVersion: host.interfaceVersion, interfaceSha256: host.interfaceSha256, componentVersion: provider.version });
    if (canonical({ framework: definition.framework, entry: { module: definition.entry.module, exportName: definition.entry.exportName }, peers: definition.peers, sha256: definition.entry.sha256 }) !== canonical({ framework: provider.framework, entry: provider.entry, peers: provider.peers, sha256: provider.integrity.sha256 })) throw new TypeError('Provider metadata differs from its captured component interface.');
    const entry = artifact.plan.bindings.bindings.find(row => row.binding.address.declarationId === host.declarationId);
    if (projected) {
      const resolved = api.resolveProjectedComponentBinding(definition, { address: entry.binding.address,
        props: Object.fromEntries(Object.entries(entry.binding.props).map(([key, value]) => [key, value.projection])),
        intents: Object.fromEntries(Object.entries(host.intents).map(([event, { payloadSchema, ...route }]) => {
          if (payloadSchema !== definition.intents[event]?.payloadSchema) throw new TypeError('Projected intent schema differs from its captured provider.');
          return [event, route];
        })) });
      if (canonical(resolved.binding) !== canonical(entry.binding)) throw new TypeError('Projected binding differs from its provider-owned interface.');
      if (canonical(resolved.routes) !== canonical(host.intents)) throw new TypeError('Projected routes differ from their provider-owned interface.');
      bindings.set(host.declarationId, Object.freeze({ definition, resolved })); continue;
    }
    const scoped = artifact.schema === 'xtend.maraca.xtension-composition-artifact.v8';
    const props = Object.fromEntries(Object.entries(entry.binding.props).map(([key, value]) => [key, { state: value.state, path: scoped ? [] : value.path }]));
    const resolved = api.resolveComponentBinding(definition, { address: entry.binding.address, props, intents: scoped ? Object.fromEntries(Object.entries(host.intents).map(([name, {keyFields, ...route}])=>[name,route])) : host.intents });
    const expected = scoped ? { ...resolved.binding, props: Object.fromEntries(Object.entries(resolved.binding.props).map(([key,value])=>[key,{...value,path:entry.binding.props[key].path}])), intents: Object.fromEntries(Object.entries(resolved.binding.intents).map(([name,value])=>[name,{...value,...(Object.hasOwn(host.intents[name],'keyFields')?{keyFields:host.intents[name].keyFields}:{})}])) } : resolved.binding;
    if (canonical(expected) !== canonical(entry.binding)) throw new TypeError('Compiled binding differs from the provider-owned component contract.');
    bindings.set(host.declarationId, Object.freeze({ definition, resolved }));
  }
  return bindings;
}
