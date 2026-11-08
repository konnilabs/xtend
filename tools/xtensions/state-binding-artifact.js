// SPDX-License-Identifier: Apache-2.0
'use strict';

const { validateStateBinding, addressKey, propsFrom, data, fields, name, clone, freeze } = require('./state-binding-contract');
const XTENSION_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v1';

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
  if (input.schema !== XTENSION_STATE_BINDING_ARTIFACT_SCHEMA) invalid('Unsupported XTension binding artifact version.', '/schema');
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
    try { fields(entry, ['surface', 'binding'], 'XTension binding entry'); name(entry.surface); binding = validateStateBinding(entry.binding); }
    catch (error) { invalid(error.message, pointer); }
    if (binding.address.documentId !== input.documentId) invalid('Binding document identity differs from its artifact.', `${pointer}/binding/address`);
    const key = addressKey(binding.address);
    if (addresses.has(key) || targets.has(entry.surface)) invalid('Duplicate XTension instance address or host surface.', pointer);
    addresses.add(key); targets.add(entry.surface);
    const surface = surfaces.get(entry.surface);
    if (!surface) invalid('XTension host surface is not declared.', `${pointer}/surface`);
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
    for (const [prop, source] of Object.entries(binding.props)) {
      if (!states.has(source.state)) invalid('Controlled prop references an undeclared Model state.', `${pointer}/binding/props/${prop}/state`);
    }
    try { propsFrom(initial, binding); }
    catch (error) { invalid(error.message, `${pointer}/binding/props`); }
    for (const [event, intent] of Object.entries(binding.intents)) {
      const action = actions.get(intent.command);
      if (!action || action.execution === 'fastpass') invalid('Intent requires a declared business Action.', `${pointer}/binding/intents/${event}/command`);
      const inputs = action.inputs || [];
      if (inputs.length !== Object.keys(intent.fields).length || inputs.some((field) =>
        !Object.hasOwn(intent.fields, field.name) || intent.fields[field.name].type !== field.type)) {
        invalid('Intent fields must match the declared Action inputs.', `${pointer}/binding/intents/${event}/fields`);
      }
    }
  });
  return freeze(clone(input));
}

module.exports = { XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBindingArtifact };
