// SPDX-License-Identifier: Apache-2.0
'use strict';

const { validateStateBinding, addressKey, propsFrom, data, record, fields, name, clone, freeze, segments, readBindingPath } = require('./state-binding-contract');
const XTENSION_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v3';
const CONDITIONAL_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v2';
const validated = new WeakSet();
const LEGACY_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v1';

function invalid(message, pointer = '') {
  const error = new TypeError(message);
  error.code = 'rmt.xtensions.binding.invalid';
  error.diagnostics = [{ code: error.code, severity: 'error', message, pointer, stage: 'xtension-bindings' }];
  throw error;
}

/** Closed, unreleased sidecar contract. No functions, provider handles or AST additions. */
function validateStateBindingArtifact(input, program) {
  try { data(input); fields(input, ['schema', 'documentId', 'bindings'], 'XTension binding artifact'); name(input.documentId); }
  catch (error) { invalid(error.message); }
  if (![XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, CONDITIONAL_ARTIFACT_SCHEMA, LEGACY_ARTIFACT_SCHEMA].includes(input.schema)) invalid('Unsupported XTension binding artifact version.', '/schema');
  if (!Array.isArray(input.bindings)) invalid('Binding artifact requires a bindings array.', '/bindings');
  try { data(program, new Set(), true); } catch (error) { invalid(error.message); }
  if (!program || program.schema !== 'xtend.rmt.app-orchestration.v1') invalid('XTension bindings require the supported compiled RMT orchestration artifact.');
  function symbols(entries, label) {
    if (!Array.isArray(entries)) invalid(`Compiled ${label} must be an array.`);
    const result = new Map();
    for (const entry of entries) {
      try { name(entry?.id); } catch (error) { invalid(`Invalid compiled ${label} identity: ${error.message}`); }
      if (result.has(entry.id)) invalid(`Duplicate compiled ${label} identity.`);
      result.set(entry.id, entry);
    }
    return result;
  }
  const states = symbols(program.state?.states || [], 'state');
  const actions = symbols(program.actions?.actions || [], 'Action');
  const surfaces = symbols(program.surfaces || [], 'surface');
  const addresses = new Set(), targets = new Set();
  const initial = { states: Object.fromEntries([...states].map(([id, state]) => [id, state.initial])) };
  input.bindings.forEach((entry, index) => {
    const pointer = `/bindings/${index}`;
    let binding;
    try {
      fields(entry, ['surface', 'binding', ...(input.schema !== LEGACY_ARTIFACT_SCHEMA ? ['presence'] : []), ...(input.schema === XTENSION_STATE_BINDING_ARTIFACT_SCHEMA ? ['repeat'] : [])], 'XTension binding entry');
      name(entry.surface); validateRepeat(entry.repeat);
      if (input.schema !== XTENSION_STATE_BINDING_ARTIFACT_SCHEMA && entry.binding?.schema !== 'xtend.xtensions.state-binding.v1') throw new TypeError('Legacy artifacts require the unchanged v1 binding contract.');
      const keys = (entry.repeat || []).map((_, i) => Object.values(entry.binding.intents || {}).some(intent => Object.values(intent.keyFields || {}).some(field => field.index === entry.binding.address.keys.length + i && field.type === 'number')) ? 0 : 'template-key');
      binding = concreteBinding(entry, keys);
    }
    catch (error) { invalid(error.message, pointer); }
    if (binding.address.documentId !== input.documentId) invalid('Binding document identity differs from its artifact.', `${pointer}/binding/address`);
    const key = addressKey(entry.binding.address);
    if (addresses.has(key) || targets.has(entry.surface)) invalid('Duplicate XTension instance address or host surface.', pointer);
    addresses.add(key); targets.add(entry.surface);
    const surface = surfaces.get(entry.surface);
    if (!surface) invalid('XTension host surface is not declared.', `${pointer}/surface`);
    if (entry.repeat && [...surfaces.keys()].some(id => id.startsWith('xtension:'))) invalid('Repeated host plans reserve the xtension: surface namespace.', `${pointer}/surface`);
    if (surface.repeat || surface.source) invalid('This artifact version supports static host surfaces only.', `${pointer}/surface`);
    const hosts = [];
    function visit(node, staticPath = true) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach((child) => visit(child, staticPath)); return; }
      const direct = ['fragment', 'component', 'element'].includes(node.type);
      if (node.surface === entry.surface) hosts.push({ node, staticPath: staticPath && direct });
      // Only direct static children participate in the A02.2 host contract.
      if (node.children) visit(node.children, staticPath && direct);
      for (const [field, child] of Object.entries(node)) {
        if (['children', 'attributes', 'properties', 'props', 'bindings'].includes(field)) continue;
        if (child && typeof child === 'object') visit(child, false);
      }
    }
    visit(program.render?.root);
    if (hosts.length !== 1 || !hosts[0].staticPath || hosts[0].node.key !== entry.surface ||
      Object.hasOwn(hosts[0].node, 'children') || Object.hasOwn(hosts[0].node, 'text')) {
      invalid('An XTension requires one empty, keyed, static render host.', `${pointer}/surface`);
    }
    if (entry.repeat && (hosts[0].node.attributes?.id !== undefined || hosts[0].node.properties?.id !== undefined)) invalid('Repeated host templates cannot duplicate a DOM id.', `${pointer}/surface`);
    if (entry.repeat && (surface.events?.length || surface.resources?.length || Object.keys(hosts[0].node.bindings || {}).length)) {
      invalid('Repeated hosts require explicit binding intents and host-owned resources; native template event/resource/binding instancing is not declared.', `${pointer}/surface`);
    }
    if (entry.repeat && !states.has(entry.repeat[0].state)) invalid('Repeat source references an undeclared Model state.', `${pointer}/repeat`);
    for (const [prop, source] of Object.entries(binding.props)) {
      if (!states.has(source.state)) invalid('Controlled prop references an undeclared Model state.', `${pointer}/binding/props/${prop}/state`);
      if (entry.repeat && !entry.binding.props[prop].path.some(part => part && typeof part === 'object' && Object.hasOwn(part, 'repeat'))) {
        try { propsFrom(initial, { ...binding, props: { [prop]: source } }); }
        catch (error) { invalid(error.message, `${pointer}/binding/props/${prop}`); }
      }
    }
    try { if (!entry.repeat) propsFrom(initial, binding); }
    catch (error) { invalid(error.message, `${pointer}/binding/props`); }
    if (Object.hasOwn(entry, 'presence')) {
      try {
        fields(entry.presence, ['state', 'path'], 'Host presence');
        if (!states.has(entry.presence.state)) throw new TypeError('Host presence references an undeclared Model state.');
        const guard = validateStateBinding({ schema: binding.schema, address: binding.address,
          props: { present: { state: entry.presence.state, path: templatePath(entry.presence, entry, binding.address.keys.slice(entry.binding.address.keys.length)), type: 'boolean' } }, intents: {} });
        if (!entry.repeat || !entry.presence.path.some(part => part && typeof part === 'object' && Object.hasOwn(part, 'repeat'))) propsFrom(initial, guard);
      } catch (error) { invalid(error.message, `${pointer}/presence`); }
    }
    for (const [event, intent] of Object.entries(binding.intents)) {
      const action = actions.get(intent.command);
      if (!action || action.execution === 'fastpass') invalid('Intent requires a declared business Action.', `${pointer}/binding/intents/${event}/command`);
      const inputs = action.inputs || [];
      const inputFields = { ...intent.fields, ...intent.keyFields };
      if (inputs.length !== Object.keys(inputFields).length || inputs.some((field) =>
        !Object.hasOwn(inputFields, field.name) || inputFields[field.name].type !== field.type)) {
        invalid('Intent fields must match the declared Action inputs.', `${pointer}/binding/intents/${event}/fields`);
      }
    }
  });
  try { expand(input, initial); } catch (error) { invalid(error.message); }
  const result = freeze(clone(input)); validated.add(result); return result;
}

function validateRepeat(repeat) {
  if (repeat === undefined) return;
  if (!Array.isArray(repeat) || !repeat.length) throw new TypeError('Repeat requires a nonempty scope chain.');
  repeat.forEach((scope, index) => {
    fields(scope, index === 0 ? ['state', 'path', 'key'] : ['path', 'key'], 'Repeat scope');
    if (index === 0) name(scope.state);
    segments(scope.path); segments(scope.key);
    if (!scope.key.length) throw new TypeError('Repeat requires an explicit nonempty item key path.');
  });
}
function templatePath(source, entry, keys) {
  if (!Array.isArray(source.path)) throw new TypeError('Binding paths must be segment arrays.');
  return source.path.map((part, position) => {
    if (!part || typeof part !== 'object' || !Object.hasOwn(part, 'repeat')) return part;
    fields(part, ['repeat'], 'Repeat path reference');
    const level = part.repeat;
    if (!entry.repeat || !Number.isSafeInteger(level) || level < 0 || Object.is(level, -0) || level >= entry.repeat.length) throw new TypeError('Unknown repeat path scope.');
    const prefix = entry.repeat.slice(0, level + 1).flatMap((scope, i) => [...scope.path, { repeat: i }]);
    if (source.state !== entry.repeat[0].state || JSON.stringify(source.path.slice(0, position + 1)) !== JSON.stringify(prefix)) throw new TypeError('Repeat paths must follow the declared Model scope chain.');
    return { key: { path: entry.repeat[level].key, value: keys[level] } };
  });
}
function concreteBinding(entry, keys) {
  // Preserve raw numeric values until validation (JSON cloning would erase -0).
  const binding = { ...entry.binding, address: { ...entry.binding.address, keys: [...entry.binding.address.keys, ...keys] },
    props: Object.fromEntries(Object.entries(entry.binding.props).map(([prop, source]) => [prop, { ...source, path: templatePath(source, entry, keys) }])) };
  if (entry.repeat && binding.schema !== 'xtend.xtensions.state-binding.v2') throw new TypeError('Repeated templates require state binding v2.');
  return validateStateBinding(binding);
}
function expand(artifact, snapshot) {
  const rows = [], addresses = new Set(), hosts = new Set();
  for (const entry of artifact.bindings) {
    const visit = (level, item, keys) => {
      if (entry.repeat && level < entry.repeat.length) {
        const scope = entry.repeat[level];
        const collection = readBindingPath(level === 0 ? snapshot.states[scope.state] : item, scope.path);
        if (!Array.isArray(collection)) throw new TypeError('Repeat sources must be Model arrays.');
        const seen = new Set();
        for (const child of collection) {
          const key = readBindingPath(child, scope.key); segments([key]);
          const token = JSON.stringify(key);
          if (seen.has(token)) throw new TypeError('Repeat item keys must be unique within each parent scope.');
          seen.add(token); visit(level + 1, child, [...keys, key]);
        }
        return;
      }
      const binding = concreteBinding(entry, keys), key = addressKey(binding.address);
      const hostSurface = entry.repeat ? `xtension:${key}` : entry.surface;
      if (addresses.has(key) || hosts.has(hostSurface)) throw new TypeError('Materialized XTension addresses and hosts must be unique.');
      addresses.add(key); hosts.add(hostSurface);
      if (entry.presence) {
        const present = readBindingPath(snapshot.states, [entry.presence.state, ...templatePath(entry.presence, entry, keys)]);
        if (typeof present !== 'boolean') throw new TypeError('Host presence requires a boolean Model value.');
        if (!present) return;
      }
      propsFrom(snapshot, binding);
      rows.push({ surface: entry.surface, hostSurface, binding });
    };
    visit(0, null, []);
  }
  return freeze(rows);
}
/** The artifact must first be validated against its compiled program in this runtime. */
function materializeStateBindingArtifact(artifact, snapshot) {
  if (!validated.has(artifact)) throw new TypeError('Materialization requires a validated binding artifact.');
  try {
    const source = Object.getOwnPropertyDescriptor(snapshot, 'states');
    if (!source || !('value' in source)) throw new TypeError('Materialization requires a plain Model states snapshot.');
    record(source.value, 'Model states'); data(source.value); return expand(artifact, { states: source.value });
  }
  catch (error) { invalid(error.message); }
}

module.exports = { XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBindingArtifact, materializeStateBindingArtifact };
