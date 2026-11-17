'use strict';
const { data, fields, name, clone, freeze } = require('../xtensions/state-binding-contract');
const { normalizeComponentInterface, resolveProjectedComponentBinding } = require('../xtensions/component-interface');
const { visitProjection } = require('../xtensions/state-binding-projection');
const { validateStateBindingArtifact } = require('../xtensions/state-binding-artifact');
const RMTX_COMPONENT_BINDINGS_API_VERSION = '1.0.0';
const RMTX_COMPONENT_DEPENDENCIES_SCHEMA = 'xtend.rmtx.component-dependencies.v1';
function projectRmtxComponents({ contract, catalog, program }) {
  data(contract); data(catalog); data(program, new Set(), true);
  fields(contract, ['schema', 'sourceProfile', 'documentId', 'hosts'], 'Component source contract');
  fields(catalog, ['schema', 'apiVersion', 'records', 'providers', 'interfaces'], 'Captured component catalog');
  if (contract?.schema !== 'xtend.rmtx.components.v1' || contract.sourceProfile?.version !== '4.0.0' || contract.sourceProfile.syntax !== 'rmtx' ||
      !Array.isArray(contract.hosts) || !contract.hosts.length || contract.hosts.length > 256 || catalog?.schema !== 'xtend.xtensions.component-interface-catalog.v1' ||
      catalog.apiVersion !== '1.0.0' || !Array.isArray(catalog.records) || program?.schema !== 'xtend.rmt.app-orchestration.v2') throw new TypeError('Inline components require explicit source4, captured interfaces and orchestration2.');
  name(contract.documentId);
  const records = new Map(), actions = new Map((program.actions?.actions || []).map(action => [action.id, action]));
  const surfaces = new Set((program.surfaces || []).map(surface => surface.id)), declarations = new Set(), targets = new Set(), used = new Set(), dependencies = [];
  for (const entry of catalog.records) {
    const definition = normalizeComponentInterface(entry.definition);
    if (records.has(definition.providerId) || !/^[a-f0-9]{64}$/.test(entry.interfaceSha256) || entry.moduleSha256 !== definition.entry.sha256 || typeof entry.file !== 'string' || !/^\.\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.json$/.test(entry.file)) throw new TypeError('Captured provider identity is invalid.');
    records.set(definition.providerId, { ...entry, definition });
  }
  const bindings = [], hosts = [];
  for (const host of contract.hosts) {
    fields(host, ['declarationId', 'surface', 'providerId', 'ownerSurface', 'lane', 'props', 'intents', 'repeat', 'presence', 'range'], 'Source component host');
    for (const key of ['declarationId', 'surface', 'providerId', 'ownerSurface', 'lane']) name(host[key]);
    if (declarations.has(host.declarationId) || targets.has(host.surface) || !surfaces.has(host.surface) || !surfaces.has(host.ownerSurface)) throw new TypeError('Source hosts require unique declarations/targets and declared owner surfaces.');
    declarations.add(host.declarationId); targets.add(host.surface); used.add(host.providerId);
    const captured = records.get(host.providerId); if (!captured) throw new TypeError('Source provider is absent from the pinned catalog.');
    const routes = {};
    for (const [event, route] of Object.entries(host.intents || {})) {
      fields(route, ['action', 'payload', 'keys'], 'Source intent'); name(route.action);
      const action = actions.get(route.action); if (!action || action.execution === 'fastpass') throw new TypeError('Provider intents require a declared business Action.');
      if (Object.hasOwn(route, 'keys')) fields(route.keys, Object.keys(route.keys || {}), 'Intent address keys');
      const keyFields = {};
      for (const [key, index] of Object.entries(route.keys || {})) {
        name(key); const input = (action.inputs || []).find(input => input.name === key);
        if (!Number.isSafeInteger(index) || index < 0 || Object.is(index, -0) || index >= (host.repeat?.length || 0) || !input || !['string', 'number', 'json'].includes(input.type)) throw new TypeError('Intent key mappings require valid trusted address indices and matching Action inputs.');
        if (Object.hasOwn(route.payload || {}, key)) throw new TypeError('Trusted keys and provider payload fields cannot overlap.');
        keyFields[key] = { index, type: input.type };
      }
      routes[event] = { command: route.action, payload: Object.hasOwn(route, 'payload') ? route.payload : {}, ...(Object.keys(keyFields).length ? { keyFields } : {}) };
    }
    const resolved = resolveProjectedComponentBinding(captured.definition, {
      address: { documentId: contract.documentId, declarationId: host.declarationId, keys: [] }, props: host.props, intents: routes
    });
    const entry = { surface: host.surface, binding: resolved.binding, ...(Object.hasOwn(host, 'repeat') ? { repeat: host.repeat } : {}), ...(Object.hasOwn(host, 'presence') ? { presence: host.presence } : {}) };
    bindings.push(entry);
    hosts.push({ declarationId: host.declarationId, providerId: host.providerId, ownerSurface: host.ownerSurface, targetSurface: host.surface,
      interfaceVersion: captured.definition.version, interfaceSha256: captured.interfaceSha256, intents: resolved.routes,
      capabilityRequirements: { schema: 'xtend.xtensions.host-capability-requirements.v1', framework: captured.definition.framework,
        required: { features: ['kernel.lifecycle', 'fabric.boundary', 'surface.lifecycle', 'props.controlled'], events: Object.keys(routes), work: [], resources: [] } } });
    const reads = [], seen = new Set();
    for (const [prop, value] of Object.entries(resolved.binding.props)) {
      visitProjection(value.projection, projection => {
        if (projection.kind !== 'path') return;
        const record = { root: projection.root, symbol: projection.symbol, path: clone(projection.path) }, token = JSON.stringify(record);
        if (!seen.has(token)) { seen.add(token); reads.push(record); }
      });
    }
    dependencies.push({ declarationId: host.declarationId, reads, allSyntacticBranches: true });
  }
  const xtensionBindings = validateStateBindingArtifact({ schema: 'xtend.xtensions.state-binding-artifact.v4', documentId: contract.documentId, bindings }, program);
  const selected = [...used].sort().map(id => records.get(id));
  const xtensionComposition = {
    schema: 'xtend.maraca.xtension-composition-manifest.v8',
    providers: selected.map(({ definition: value }) => ({ id: value.providerId, framework: value.framework, version: value.componentVersion,
      entry: { module: value.entry.module, exportName: value.entry.exportName }, integrity: { sha256: value.entry.sha256 }, peers: value.peers })),
    modules: selected.map(({ definition }) => ({ module: definition.entry.module, sha256: definition.entry.sha256 })),
    interfaces: selected.map(row => ({ providerId: row.definition.providerId, file: row.file, sha256: row.interfaceSha256 })),
    loading: { provider: 'on-mount', peers: 'shared' },
    delivery: { schema: 'xtend.maraca.xtension-delivery-policy.v1', mode: 'same-origin-external-esm' }, hosts
  };
  return freeze({ xtensionBindings, xtensionComposition, dependencies: {
    schema: RMTX_COMPONENT_DEPENDENCIES_SCHEMA, sourceProfile: contract.sourceProfile, declarations: dependencies,
    runtimeTracking: false, runtimeSubscriptionsChanged: false,
    selectorValueValidation: 'existing-runtime-props-boundary', missingModelPathFallback: false
  } });
}
module.exports = { RMTX_COMPONENT_BINDINGS_API_VERSION, RMTX_COMPONENT_DEPENDENCIES_SCHEMA, projectRmtxComponents };
