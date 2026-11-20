// SPDX-License-Identifier: Apache-2.0
'use strict';

const { validateStateBinding, addressKey, propsFrom, data, record, fields, name, clone, freeze, segments, readBindingPath } = require('./state-binding-contract');
const XTENSION_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v3';
const PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v4';
const NATIVE_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v5';
const MANAGED_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v8';
const ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v7';
const LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v6';
const { validateRepeat, templatePath, expandRepeatScopes } = require('./repeat-scopes');
const projections = require('./state-binding-projection');
const { assertNativeCanonicalData } = require('./native-data');
const { validateNativeLifecyclePlan } = require('./native-lifecycle');
function usesSelectors(source) { let found = false; projections.visitProjection(source, node => { if (node.kind === 'path' && node.root === 'selector') found = true; }); return found; }
function checkProps(snapshot, binding, initial = false) {
  if (!initial || binding.schema !== 'xtend.xtensions.state-binding.v3') return propsFrom(snapshot, binding);
  for (const [key, source] of Object.entries(binding.props)) if (!usesSelectors(source.projection)) propsFrom(snapshot, { ...binding, props: { [key]: source } });
}
function inputRuleAccepts(source, target) {
  if (!source || !target) return false;
  if (source.nullable === true && target.nullable !== true) return false;
  if (target.type === 'json') return true;
  if (source.type !== target.type) return false;
  return source.type !== 'array' || inputRuleAccepts(source.items, target.items);
}
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
function validateStateBindingArtifact(input, program) { return validateArtifactProfile(input, program, null); }
function validateLifecycleStateBindingArtifact(input, program) {
  try { assertNativeCanonicalData(input); } catch (error) { invalid(error.message); }
  return validateArtifactProfile(input, program, validateNativeLifecyclePlan);
}
function validateArtifactProfile(input, program, lifecycleValidator, orchestrated = false, managed = false) {
  if (managed && !orchestrated) invalid('Managed bindings require the explicit orchestrated profile');
  try { data(input); fields(input, ['schema', 'documentId', 'bindings'], 'XTension binding artifact'); name(input.documentId); }
  catch (error) { invalid(error.message); }
  const lifecycle = typeof lifecycleValidator === 'function';
  if (lifecycle ? input.schema !== (managed ? MANAGED_STATE_BINDING_ARTIFACT_SCHEMA : orchestrated ? ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA : LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA) : ![XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, CONDITIONAL_ARTIFACT_SCHEMA, LEGACY_ARTIFACT_SCHEMA, PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA, NATIVE_STATE_BINDING_ARTIFACT_SCHEMA].includes(input.schema)) invalid('Unsupported XTension binding artifact version.', '/schema');
  const native = lifecycle || input.schema === NATIVE_STATE_BINDING_ARTIFACT_SCHEMA;
  const projected = native || input.schema === PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA;
  if (!Array.isArray(input.bindings)) invalid('Binding artifact requires a bindings array.', '/bindings');
  try { data(program, new Set(), true); } catch (error) { invalid(error.message); }
  if (!program || program.schema !== (managed ? 'xtend.rmt.app-orchestration.v6' : orchestrated ? 'xtend.rmt.app-orchestration.v5' : lifecycle ? 'xtend.rmt.app-orchestration.v4' : native ? 'xtend.rmt.app-orchestration.v3' : projected ? 'xtend.rmt.app-orchestration.v2' : 'xtend.rmt.app-orchestration.v1')) invalid(lifecycle ? 'Lifecycle XTension bindings require compiled RMT orchestration artifact v4.' : native ? 'Native XTension bindings require compiled RMT orchestration artifact v3.' : projected ? 'XTension bindings require compiled RMT orchestration artifact v2.' : 'XTension bindings require the supported compiled RMT orchestration artifact.');
  if (lifecycle) {
    try { lifecycleValidator(program); } catch (error) { invalid(error.message); }
  }
  if (native) {
    try {
      const header = program.render?.nativeView;
      fields(header, managed ? ['schema', 'documentId', 'surfaces', 'scopes', 'components', 'eventKeys', 'bindings', 'events', 'commands'] : orchestrated ? ['schema', 'documentId', 'surfaces', 'scopes', 'components', 'eventKeys'] : ['schema', 'documentId', 'surfaces'], 'Native View header'); name(header.documentId);
      if (header.schema !== (managed ? 'xtend.rmt.native-view.v3' : orchestrated ? 'xtend.rmt.native-view.v2' : 'xtend.rmt.native-view.v1') || header.documentId !== input.documentId || !Array.isArray(header.surfaces)
          || new Set(header.surfaces).size !== header.surfaces.length) throw new TypeError('Native bindings require their matching compiled Native View header.');
      header.surfaces.forEach(name);
    } catch (error) { invalid(error.message); }
  }
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
  const inputContract = projected ? program.actions?.inputContract : null;
  if (projected && (inputContract?.schema !== 'xtend.rmt.action-input-contract.v1' || !Array.isArray(inputContract.actions))) invalid('Projection bindings require the compiler-owned Action input contract.');
  const selectors = projected ? symbols(program.state?.selectors || [], 'selector') : new Map();
  const surfaces = symbols(program.surfaces || [], 'surface');
  if (native && program.render.nativeView.surfaces.some(id => !surfaces.has(id))) invalid('Native View header references an undeclared Surface.');
  const addresses = new Set(), targets = new Set();
  const initial = { states: Object.fromEntries([...states].map(([id, state]) => [id, state.initial])) };
  input.bindings.forEach((entry, index) => {
    const pointer = `/bindings/${index}`;
    let binding;
    try {
      fields(entry, ['surface', 'binding', ...(orchestrated ? ['ownerSurface'] : []), ...(input.schema !== LEGACY_ARTIFACT_SCHEMA ? ['presence'] : []), ...([XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA, NATIVE_STATE_BINDING_ARTIFACT_SCHEMA, LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA, ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA, MANAGED_STATE_BINDING_ARTIFACT_SCHEMA].includes(input.schema) ? ['repeat'] : [])], 'XTension binding entry');
      name(entry.surface); validateRepeat(entry.repeat);
      if (projected ? entry.binding?.schema !== 'xtend.xtensions.state-binding.v3' : input.schema !== XTENSION_STATE_BINDING_ARTIFACT_SCHEMA && entry.binding?.schema !== 'xtend.xtensions.state-binding.v1') throw new TypeError('Binding schema does not match its versioned artifact.');
      const keys = (entry.repeat || []).map((_, i) => Object.values(entry.binding.intents || {}).some(intent => Object.values(intent.keyFields || {}).some(field => field.index === entry.binding.address.keys.length + i && field.type === 'number')) ? 0 : 'template-key');
      binding = concreteBinding(entry, keys);
    }
    catch (error) { invalid(error.message, pointer); }
    if (binding.address.documentId !== input.documentId) invalid('Binding document identity differs from its artifact.', `${pointer}/binding/address`);
    const key = addressKey(entry.binding.address);
    if (addresses.has(key) || targets.has(entry.surface)) invalid('Duplicate XTension instance address or host surface.', pointer);
    addresses.add(key); targets.add(entry.surface);
    if (orchestrated && !surfaces.has(entry.ownerSurface)) invalid('An orchestrated host requires its declared distinct owning Surface.', pointer + '/ownerSurface');
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
    if (!orchestrated && entry.repeat && (surface.events?.length || surface.resources?.length || Object.keys(hosts[0].node.bindings || {}).length)) {
      invalid('Repeated hosts require explicit binding intents and host-owned resources; native template event/resource/binding instancing is not declared.', `${pointer}/surface`);
    }
    if (entry.repeat && !states.has(entry.repeat[0].state)) invalid('Repeat source references an undeclared Model state.', `${pointer}/repeat`);
    for (const [prop, source] of Object.entries(binding.props)) {
      if (projected) {
        projections.visitProjection(source.projection, node => {
          if (node.kind === 'path' && !(node.root === 'state' ? states : selectors).has(node.symbol)) invalid('Projection references an undeclared Model/selector symbol.', `${pointer}/binding/props/${prop}`);
        });
        continue;
      }
      if (!states.has(source.state)) invalid('Controlled prop references an undeclared Model state.', `${pointer}/binding/props/${prop}/state`);
      if (!lifecycle && entry.repeat && !entry.binding.props[prop].path.some(part => part && typeof part === 'object' && Object.hasOwn(part, 'repeat'))) {
        try { propsFrom(initial, { ...binding, props: { [prop]: source } }); }
        catch (error) { invalid(error.message, `${pointer}/binding/props/${prop}`); }
      }
    }
    try { if (!lifecycle && !entry.repeat) checkProps(initial, binding, projected); }
    catch (error) { invalid(error.message, `${pointer}/binding/props`); }
    if (Object.hasOwn(entry, 'presence')) {
      try {
        fields(entry.presence, ['state', 'path'], 'Host presence');
        if (!states.has(entry.presence.state)) throw new TypeError('Host presence references an undeclared Model state.');
        const guard = validateStateBinding({ schema: projected ? 'xtend.xtensions.state-binding.v2' : binding.schema, address: binding.address,
          props: { present: { state: entry.presence.state, path: templatePath(entry.presence, entry, binding.address.keys.slice(entry.binding.address.keys.length)), type: 'boolean' } }, intents: {} });
        if (!lifecycle && (!entry.repeat || !entry.presence.path.some(part => part && typeof part === 'object' && Object.hasOwn(part, 'repeat')))) propsFrom(initial, guard);
      } catch (error) { invalid(error.message, `${pointer}/presence`); }
    }
    for (const [event, intent] of Object.entries(binding.intents)) {
      const action = actions.get(intent.command);
      if (!action || action.execution === 'fastpass') invalid('Intent requires a declared business Action.', `${pointer}/binding/intents/${event}/command`);
      const inputs = action.inputs || [];
      const inputFields = { ...intent.fields, ...intent.keyFields };
      if (projected) {
        const target = inputContract.actions.find(row => row.id === intent.command);
        if (!target || !target.fields || Object.keys(inputFields).some(key => !Object.hasOwn(target.fields, key)) ||
            Object.entries(target.fields).some(([key, rule]) => !Object.hasOwn(inputFields, key) && rule.required) ||
            Object.entries(inputFields).some(([key, rule]) => !inputRuleAccepts(rule, target.fields[key]))) {
          invalid('Provider intent projections do not match the declared Action input contract.', `${pointer}/binding/intents/${event}/fields`);
        }
        continue;
      }
      if (inputs.length !== Object.keys(inputFields).length || inputs.some((field) =>
        !Object.hasOwn(inputFields, field.name) || inputFields[field.name].type !== field.type)) {
        invalid('Intent fields must match the declared Action inputs.', `${pointer}/binding/intents/${event}/fields`);
      }
    }
  });
  // Source6 dynamic values are checked against the actual Model/selector
  // snapshot after its complete owner admission group has been evaluated.
  try { if (!lifecycle) expand(input, initial, projected); } catch (error) { invalid(error.message); }
  const result = freeze(clone(input)); validated.add(result); return result;
}

function concreteBinding(entry, keys) {
  // Preserve raw numeric values until validation (JSON cloning would erase -0).
  const binding = { ...entry.binding, address: { ...entry.binding.address, keys: [...entry.binding.address.keys, ...keys] },
    props: Object.fromEntries(Object.entries(entry.binding.props).map(([prop, source]) => [prop, entry.binding.schema === 'xtend.xtensions.state-binding.v3'
      ? { ...source, projection: projections.mapProjection(source.projection, node => ({ ...node, path: templatePath({ state: node.symbol, path: node.path }, entry, keys) })) }
      : { ...source, path: templatePath(source, entry, keys) }])) };
  if (entry.repeat && !['xtend.xtensions.state-binding.v2', 'xtend.xtensions.state-binding.v3'].includes(binding.schema)) throw new TypeError('Repeated templates require state binding v2.');
  return validateStateBinding(binding);
}
function expand(artifact, snapshot, initial = false, admission = null) {
  const rows = [], addresses = new Set(), hosts = new Set();
  for (const entry of artifact.bindings) {
    if (admission && Object.hasOwn(admission, entry.surface) && admission[entry.surface] === false) continue;
    expandRepeatScopes(entry.repeat, snapshot, keys => {
      const binding = concreteBinding(entry, keys), key = addressKey(binding.address);
      const hostSurface = entry.repeat ? `xtension:${key}` : entry.surface;
      if (addresses.has(key) || hosts.has(hostSurface)) throw new TypeError('Materialized XTension addresses and hosts must be unique.');
      addresses.add(key); hosts.add(hostSurface);
      if (entry.presence) {
        const present = readBindingPath(snapshot.states, [entry.presence.state, ...templatePath(entry.presence, entry, keys)]);
        if (typeof present !== 'boolean') throw new TypeError('Host presence requires a boolean Model value.');
        if (!present) return;
      }
      checkProps(snapshot, binding, initial);
      rows.push({ surface: entry.surface, hostSurface, binding });
    });
  }
  return freeze(rows);
}
/** The artifact must first be validated against its compiled program in this runtime. */
function materializeStateBindingArtifact(artifact, snapshot, admission) {
  if (!validated.has(artifact)) throw new TypeError('Materialization requires a validated binding artifact.');
  if ([ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA, MANAGED_STATE_BINDING_ARTIFACT_SCHEMA].includes(artifact.schema)) throw new TypeError('Artifact7 requires its explicit orchestrated materialization port.');
  try {
    if (admission !== undefined) {
      if (artifact.schema !== LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA) throw new TypeError('Lifecycle admission requires binding artifact6.');
      data(admission); record(admission, 'Lifecycle binding admission');
      for (const [id, allowed] of Object.entries(admission)) { name(id); if (typeof allowed !== 'boolean') throw new TypeError('Lifecycle binding admission must contain boolean values.'); }
    }
    const source = Object.getOwnPropertyDescriptor(snapshot, 'states');
    if (!source || !('value' in source)) throw new TypeError('Materialization requires a plain Model states snapshot.');
    record(source.value, 'Model states'); data(source.value);
    const selected = [PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA, NATIVE_STATE_BINDING_ARTIFACT_SCHEMA, LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA].includes(artifact.schema) ? Object.getOwnPropertyDescriptor(snapshot, 'selectors') : null;
    if (selected && !('value' in selected)) throw new TypeError('Selector snapshots cannot be accessors.');
    if (selected) { record(selected.value, 'Model selector values'); data(selected.value); }
    return expand(artifact, { states: source.value, ...(selected ? { selectors: selected.value } : {}) }, false, admission);
  }
  catch (error) { invalid(error.message); }
}

module.exports = { MANAGED_STATE_BINDING_ARTIFACT_SCHEMA, _validateArtifactProfile: validateArtifactProfile, _concreteBinding: concreteBinding, ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA, validateLifecycleStateBindingArtifact, LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA, XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA, NATIVE_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBindingArtifact, materializeStateBindingArtifact };
