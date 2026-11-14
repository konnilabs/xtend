// SPDX-License-Identifier: Apache-2.0
'use strict';
// Provider-owned data contracts. Catalogs are supplied by the trusted host/build;
// a hash written into arbitrary JSON is not execution or grant authority.
const { data, fields, name, typed, clone, freeze, validateStateBinding, XTENSION_STATE_BINDING_SCHEMA } = require('./state-binding-contract');
const COMPONENT_INTERFACE_API_VERSION = '1.0.0';
const COMPONENT_INTERFACE_SCHEMA = 'xtend.xtensions.component-interface.v1';
const normalizedInterfaces = new WeakSet();
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const version = value => typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
function names(object, label) {
  fields(object, Object.keys(object || {}), label);
  if (Object.keys(object).length > 64) throw new TypeError(`${label} is limited to 64 fields.`);
  Object.keys(object).forEach(name);
}
function valueRule(rule, depth = 0) {
  if (depth > 16) throw new TypeError('Component value rules exceed the supported depth.');
  fields(rule, ['type', 'nullable', 'fields', 'items'], 'Component value rule');
  if (rule.fields) { names(rule.fields, 'Value fields'); Object.values(rule.fields).forEach(child => valueRule(child, depth + 1)); }
  if (rule.items) valueRule(rule.items, depth + 1);
}
function normalizeComponentInterface(input) {
  if (input && typeof input === 'object' && normalizedInterfaces.has(input)) return input;
  data(input); fields(input, ['schema', 'providerId', 'version', 'componentVersion', 'framework', 'entry', 'peers', 'props', 'intents', 'ownership'], 'Component interface');
  if (input.schema !== COMPONENT_INTERFACE_SCHEMA || !/^[a-z][a-z0-9-]{0,63}$/.test(input.providerId || '') || !version(input.version) || !version(input.componentVersion) || !['react', 'vue'].includes(input.framework)) throw new TypeError('A versioned React/Vue component interface v1 is required.');
  fields(input.entry, ['module', 'exportName', 'sha256'], 'Component entry');
  if (!/^\.\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:mjs|js)$/.test(input.entry.module || '') || !/^[a-zA-Z_$][\w$]*$/.test(input.entry.exportName || '') || !digest(input.entry.sha256)) throw new TypeError('A pinned local named component factory is required.');
  const peers = input.framework === 'react' ? ['react', 'react-dom'] : ['vue'];
  fields(input.peers, peers, 'Component peers');
  if (Object.keys(input.peers).length !== peers.length || peers.some(key => !(input.framework === 'react' ? /^(18|19)\.\d+\.\d+$/ : /^3\.\d+\.\d+$/).test(input.peers[key])) || input.framework === 'react' && input.peers.react !== input.peers['react-dom']) throw new TypeError('Exact matching supported component peers are required.');
  fields(input.ownership, ['attributes', 'children', 'slots'], 'Component ownership');
  if (input.ownership.attributes !== 'declared-props-only' || input.ownership.children !== 'provider-owned' || input.ownership.slots !== 'provider-owned') throw new TypeError('Component interface v1 requires closed props and provider-owned children/slots.');
  names(input.props, 'Component props'); names(input.intents, 'Component intents');
  for (const [key, rule] of Object.entries(input.props)) {
    if (key === 'children' || key === 'slots') throw new TypeError('Native children and slots are not controlled props in interface v1.');
    valueRule(rule);
  }
  for (const spec of Object.values(input.intents)) {
    fields(spec, ['payloadSchema', 'fields'], 'Component intent'); name(spec.payloadSchema); names(spec.fields, 'Intent fields'); Object.values(spec.fields).forEach(rule => valueRule(rule));
  }
  // Reuse the existing closed value-rule and reserved-prop validation.
  validateStateBinding({ schema: XTENSION_STATE_BINDING_SCHEMA, address: { documentId: 'component-interface', declarationId: input.providerId, keys: [] },
    props: Object.fromEntries(Object.entries(input.props).map(([key, rule]) => [key, { ...rule, state: 'component', path: [] }])), intents: Object.fromEntries(Object.entries(input.intents).map(([event, spec]) => [event, { command: 'component.intent', ...spec }])) });
  const result = freeze(clone(input)); normalizedInterfaces.add(result); return result;
}
function mappingFor(spec, mapping) {
  const result = mapping === undefined ? Object.fromEntries(Object.keys(spec.fields).map(key => [key, key])) : mapping;
  data(result); names(result, 'Intent payload mapping');
  const values = Object.values(result); values.forEach(name);
  if (values.length !== Object.keys(spec.fields).length || new Set(values).size !== values.length || values.some(key => !Object.hasOwn(spec.fields, key))) throw new TypeError('Intent mapping must map every provider field exactly once.');
  return clone(result);
}
function resolveComponentBinding(definition, request) {
  const iface = normalizeComponentInterface(definition);
  data(request); fields(request, ['address', 'props', 'intents'], 'Component binding request'); names(request.props, 'Prop references'); names(request.intents, 'Intent bindings');
  if (canonical(Object.keys(request.props).sort()) !== canonical(Object.keys(iface.props).sort())) throw new TypeError('Call-site props must match the provider interface exactly.');
  const props = Object.fromEntries(Object.entries(request.props).map(([key, source]) => {
    fields(source, ['state', 'path'], 'Prop reference'); return [key, { ...source, ...iface.props[key] }];
  }));
  const routes = {}, intents = {};
  for (const [event, route] of Object.entries(request.intents)) {
    const spec = Object.hasOwn(iface.intents, event) && iface.intents[event];
    if (!spec) throw new TypeError('Call-site event is not declared by the provider.');
    fields(route, ['command', 'payload', 'keyFields'], 'Intent binding'); name(route.command);
    const payload = mappingFor(spec, route.payload);
    routes[event] = { command: route.command, payload, payloadSchema: spec.payloadSchema };
    intents[event] = { command: route.command, payloadSchema: spec.payloadSchema,
      fields: Object.fromEntries(Object.entries(payload).map(([target, source]) => [target, spec.fields[source]])),
      ...(Object.hasOwn(route, 'keyFields') ? { keyFields: route.keyFields } : {}) };
  }
  const binding = validateStateBinding({ schema: XTENSION_STATE_BINDING_SCHEMA, address: request.address, props, intents });
  return freeze({ binding, routes });
}
function assertComponentProps(definition, props) {
  const iface = normalizeComponentInterface(definition);
  typed(props, { type: 'object', fields: iface.props }, 'Component props');
  return true;
}
function mapComponentIntent(definition, event, payload, mapping) {
  const iface = normalizeComponentInterface(definition), spec = Object.hasOwn(iface.intents, event) && iface.intents[event];
  if (!spec) throw new TypeError('Unknown component intent.');
  typed(payload, { type: 'object', fields: spec.fields }, 'Component intent payload');
  return freeze(Object.fromEntries(Object.entries(mappingFor(spec, mapping)).map(([target, source]) => [target, clone(payload[source])])));
}
/** Trusted captured catalog data, not call-site declarations. No code executes here. */
function createComponentInterfaceCatalog(captures) {
  data(captures);
  if (!Array.isArray(captures) || !captures.length || captures.length > 64) throw new TypeError('A bounded captured component catalog is required.');
  const entries = new Map();
  for (const capture of captures) {
    fields(capture, ['definition', 'interfaceSha256', 'moduleSha256'], 'Component capture');
    const definition = normalizeComponentInterface(capture.definition);
    if (!digest(capture.interfaceSha256) || capture.moduleSha256 !== definition.entry.sha256 || entries.has(definition.providerId)) throw new TypeError('Component capture identity or digest mismatch.');
    entries.set(definition.providerId, freeze({ ...clone(capture), definition }));
  }
  return Object.freeze({ apiVersion: COMPONENT_INTERFACE_API_VERSION,
    resolve(reference) {
      data(reference); fields(reference, ['providerId', 'interfaceVersion', 'interfaceSha256', 'componentVersion'], 'Component reference');
      const entry = entries.get(reference.providerId);
      if (!entry || reference.interfaceVersion !== entry.definition.version || reference.interfaceSha256 !== entry.interfaceSha256 || reference.componentVersion !== entry.definition.componentVersion) throw new TypeError('Component reference differs from captured provider interface.');
      return entry;
    },
    entries: () => Object.freeze([...entries.values()])
  });
}
module.exports = { COMPONENT_INTERFACE_API_VERSION, COMPONENT_INTERFACE_SCHEMA, normalizeComponentInterface,
  createComponentInterfaceCatalog, resolveComponentBinding, assertComponentProps, mapComponentIntent, canonical };
