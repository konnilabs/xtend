// SPDX-License-Identifier: Apache-2.0
'use strict';
const projections = require('./state-binding-projection');
// Provider-owned data contracts. Catalogs are supplied by the trusted host/build;
// a hash written into arbitrary JSON is not execution or grant authority.
const { data, fields, name, typed, clone, freeze, validateStateBinding, XTENSION_STATE_BINDING_SCHEMA } = require('./state-binding-contract');
const COMPONENT_INTERFACE_API_VERSION = '2.0.0';
const COMPONENT_INTERFACE_SCHEMA = 'xtend.xtensions.component-interface.v1';
const COMPONENT_INTERFACE_SCHEMA_V2 = 'xtend.xtensions.component-interface.v2';
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
  data(input); const v2 = input.schema === COMPONENT_INTERFACE_SCHEMA_V2;
  fields(input, ['schema', 'providerId', 'version', 'componentVersion', 'framework', 'entry', 'peers', 'props', 'intents', 'ownership', ...(v2 ? ['optionalProps', 'defaults'] : [])], 'Component interface');
  if (![COMPONENT_INTERFACE_SCHEMA, COMPONENT_INTERFACE_SCHEMA_V2].includes(input.schema) || !/^[a-z][a-z0-9-]{0,63}$/.test(input.providerId || '') || !version(input.version) || !version(input.componentVersion) || !['react', 'vue'].includes(input.framework)) throw new TypeError('A versioned React/Vue component interface is required.');
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
  if (v2) {
    const optional = Object.hasOwn(input, 'optionalProps') ? input.optionalProps : [], defaults = Object.hasOwn(input, 'defaults') ? input.defaults : {};
    if (!Array.isArray(optional) || new Set(optional).size !== optional.length || optional.some(key => typeof key !== 'string' || !Object.hasOwn(input.props, key))) throw new TypeError('Optional props must name unique provider-declared props.');
    names(defaults, 'Provider defaults');
    for (const [key, value] of Object.entries(defaults)) {
      if (!optional.includes(key)) throw new TypeError('Defaults may only belong to provider-declared optional props.');
      typed(value, input.props[key], 'Provider default ' + key);
    }
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
  if (iface.schema === COMPONENT_INTERFACE_SCHEMA_V2) {
    data(props); names(props, 'Component props'); const optional = iface.optionalProps || [];
    if (Object.keys(props).some(key => !Object.hasOwn(iface.props, key)) || Object.keys(iface.props).some(key => !optional.includes(key) && !Object.hasOwn(props, key))) throw new TypeError('Props do not match the provider required/optional declaration.');
    for (const [key, value] of Object.entries(props)) typed(value, iface.props[key], 'Component prop ' + key);
    return true;
  }
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
  return Object.freeze({ apiVersion: '1.0.0',
    resolve(reference) {
      data(reference); fields(reference, ['providerId', 'interfaceVersion', 'interfaceSha256', 'componentVersion'], 'Component reference');
      const entry = entries.get(reference.providerId);
      if (!entry || reference.interfaceVersion !== entry.definition.version || reference.interfaceSha256 !== entry.interfaceSha256 || reference.componentVersion !== entry.definition.componentVersion) throw new TypeError('Component reference differs from captured provider interface.');
      return entry;
    },
    entries: () => Object.freeze([...entries.values()])
  });
}
function providerField(rule, path) {
  const parts = Array.isArray(path) ? path : typeof path === 'string' ? path.split('.') : [];
  if (!parts.length || parts.some(part => typeof part !== 'string' || !part || ['__proto__', 'prototype', 'constructor'].includes(part))) throw new TypeError('A safe provider payload path is required.');
  let cursor = { type: 'object', fields: rule.fields };
  for (const part of parts) {
    if (cursor.type === 'object' && Object.hasOwn(cursor.fields, part)) cursor = cursor.fields[part];
    else if (cursor.type === 'array' && /^(0|[1-9]\d*)$/.test(part) && Number.isSafeInteger(Number(part))) cursor = cursor.items;
    else throw new TypeError('Provider payload projection path is not declared by the interface.');
  }
  return { path: parts, rule: cursor };
}
function resolveProjectedComponentBinding(definition, request) {
  const iface = normalizeComponentInterface(definition);
  data(request); fields(request, ['address', 'props', 'intents'], 'Projected component request'); names(request.props, 'Prop projections'); names(request.intents, 'Intent routes');
  const optional = iface.optionalProps || [], defaults = iface.defaults || {};
  if (Object.keys(request.props).some(key => !Object.hasOwn(iface.props, key)) || Object.keys(iface.props).some(key => !optional.includes(key) && !Object.hasOwn(request.props, key))) throw new TypeError('Source props must match the captured provider required/optional contract.');
  const props = Object.fromEntries(Object.entries(iface.props).flatMap(([key, rule]) => {
    const projection = Object.hasOwn(request.props, key) ? request.props[key] : Object.hasOwn(defaults, key) ? { kind: 'literal', value: defaults[key] } : null;
    if (!projection) return [];
    projections.visitProjection(projection, () => {});
    return [[key, { ...rule, projection }]];
  }));
  const intents = {}, routes = {};
  for (const [event, route] of Object.entries(request.intents)) {
    const spec = Object.hasOwn(iface.intents, event) && iface.intents[event];
    if (!spec) throw new TypeError('Source intent is absent from the captured provider interface.');
    fields(route, ['command', 'payload', 'keyFields'], 'Projected intent route'); name(route.command);
    const payload = Object.hasOwn(route, 'payload') ? route.payload : Object.fromEntries(Object.keys(spec.fields).map(key => [key, key]));
    names(payload, 'Projected intent mapping');
    const mappings = Object.fromEntries(Object.entries(payload).map(([key, path]) => [key, providerField(spec, path)]));
    intents[event] = { command: route.command, payloadSchema: spec.payloadSchema, fields: Object.fromEntries(Object.entries(mappings).map(([key, value]) => [key, value.rule])),
      ...(Object.hasOwn(route, 'keyFields') ? { keyFields: route.keyFields } : {}) };
    routes[event] = { command: route.command, payloadSchema: spec.payloadSchema, payload: Object.fromEntries(Object.entries(mappings).map(([key, value]) => [key, value.path])),
      ...(Object.hasOwn(route, 'keyFields') ? { keyFields: route.keyFields } : {}) };
  }
  return freeze({ binding: { schema: 'xtend.xtensions.state-binding.v3', address: request.address, props, intents }, routes });
}
function mapProjectedComponentIntent(definition, event, payload, mapping) {
  const iface = normalizeComponentInterface(definition), spec = Object.hasOwn(iface.intents, event) && iface.intents[event];
  if (!spec) throw new TypeError('Unknown provider intent.');
  typed(payload, { type: 'object', fields: spec.fields }, 'Provider intent payload');
  return freeze(Object.fromEntries(Object.entries(mapping).map(([target, path]) => {
    name(target); const projected = providerField(spec, path); let value = payload;
    for (const segment of projected.path) {
      if (!value || typeof value !== 'object' || !Object.hasOwn(value, segment)) throw new TypeError('Provider payload path is absent.');
      value = value[segment];
    }
    typed(value, projected.rule, 'Mapped provider payload'); return [target, clone(value)];
  })));
}
module.exports = { COMPONENT_INTERFACE_API_VERSION, COMPONENT_INTERFACE_SCHEMA, COMPONENT_INTERFACE_SCHEMA_V2, normalizeComponentInterface,
  createComponentInterfaceCatalog, resolveComponentBinding, resolveProjectedComponentBinding, assertComponentProps, mapComponentIntent, mapProjectedComponentIntent, canonical };
