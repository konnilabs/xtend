// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data, fields, name, segments, clone, freeze } = require('./state-binding-contract');
const { assertNativeCanonicalData } = require('./native-data');
const projections = require('./state-binding-projection');
const { validateRepeat, templatePath } = require('./repeat-scopes');
const native = require('./native-sink-contract');
function createNativeSurfaceViewValidation({apiVersion,headerSchema,programSchema,validateMetadata,nativeComponentSinkAllowed,scopes,lifecycle,managed=false,validateComponentValues,validateComponentBindings}) {

// Source7 is an optional, independently versioned port. Legacy Program3/4
// validators deliberately never load or admit this grammar.




const NATIVE_SURFACE_VIEW_API_VERSION = apiVersion;
const NATIVE_SURFACE_VIEW_SCHEMA = headerSchema;
const tags = new Set(native.NATIVE_VIEW_TAG_NAMES), voidTags = new Set(native.NATIVE_VIEW_VOID_TAG_NAMES);
const booleanProperties = new Set('checked disabled selected readOnly required multiple indeterminate open'.split(' '));
const booleanAttributes = new Set('hidden disabled checked selected readonly required multiple open autofocus novalidate controls autoplay loop muted inert reversed'.split(' '));
const validated = new WeakSet();
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function invalid(message) { throw Object.assign(new TypeError(message), { code: 'rmt.native-view.invalid' }); }
function scalar(value, label) {
  if (value !== null && !['string', 'boolean', 'number'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)) invalid(`${label} requires a finite scalar or null.`);
  return value;
}
function key(documentId, declaration, keys) {
  segments(keys);
  const result = JSON.stringify([documentId, declaration, keys]);
  if (result.length > native.NATIVE_VIEW_MAX_KEY_LENGTH) invalid('Native DOM key exceeds its explicit limit; keys are never truncated.');
  return result;
}
function symbols(program) {
  function ids(entries, label) {
    if (!Array.isArray(entries)) invalid(`Native programs require declared ${label} symbols.`);
    const result = new Set();
    for (const entry of entries) { name(entry.id); if (result.has(entry.id)) invalid(`Duplicate ${label} symbol.`); result.add(entry.id); }
    return result;
  }
  const result = { states: ids(program.state?.states || [], 'state'), selectors: ids(program.state?.selectors || [], 'selector'), surfaces: new Map(), components: new Map() };
  ids(program.surfaces || [], 'Surface');
  for (const definition of program.surfaces || []) {
    if (!tags.has(definition.component)) invalid('Native Surface wrappers require safe HTML components.');
    result.surfaces.set(definition.id, definition);
  }
  for (const metadata of program.render.nativeView.components) {
    const value = validateMetadata(metadata);
    if (managed && (!['ui','platform'].includes(value.role) || value.status.implementation !== 'implemented')) invalid('Source8 runtime requires implemented productive native definitions.');
    if (result.components.has(value.tag)) invalid('Native component metadata must have unique tags.');
    result.components.set(value.tag, value);
  }
  return result;
}
function expression(value, repeat, table, structured = false) {
  projections.visitProjection(value, node => {
    if (!structured && ['object', 'array'].includes(node.kind)) invalid('Native sinks require scalar IR3.');
    if (node.kind === 'literal') structured ? data(node.value) : scalar(node.value, 'Native projection literal');
    if (node.kind !== 'path') return;
    if (!(node.root === 'state' ? table.states : table.selectors).has(node.symbol)) invalid('Native projection references an undeclared Model/selector.');
    for (const part of node.path) if (part && typeof part === 'object') fields(part, ['repeat'], 'Native repeat path'); else segments([part]);
  });
  projections.validateProjection(projections.mapProjection(value, node => ({ ...node,
    path: templatePath({ state: node.symbol, path: node.path }, { repeat }, (repeat || []).map(() => 'native-template-key')) })));
}
function marker(value, repeat, table, structured = false) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Native sinks require explicit literal/projection markers.');
  if (value.op === 'literal') { fields(value, ['op', 'value'], 'Native literal'); structured ? data(value.value) : scalar(value.value, 'Native literal'); }
  else if (value.op === 'native-projection') { fields(value, ['op', 'projection'], 'Native projection'); expression(value.projection, repeat, table, structured); }
  else invalid('Unknown native sink marker.');
}
function validateRoot(root, program, table) {
  const header = program.render.nativeView, contract = scopes.validateNativeSurfaceScopes(program);
  const scopeMap = new Map(contract.declarations.map(row => [row.surface, row]));
  const declarations = new Set(), owners = new Set(), surfaces = new Set(), domIds = new Set();
  let count = 0;
  function declaration(node) {
    name(node.nativeDeclarationId);
    if (declarations.has(node.nativeDeclarationId)) invalid('Native declaration identities must be document-unique.');
    declarations.add(node.nativeDeclarationId);
  }
  function sinks(node, context, component) {
    for (const [kind, map] of [['attributes', node.attributes || {}], ['properties', node.properties || {}]]) {
      fields(map, Object.keys(map), 'Native sink map');
      for (const [name, value] of Object.entries(map)) {
        if (component) { if (!nativeComponentSinkAllowed(component, name, kind === 'attributes' ? 'attribute' : 'property')) invalid('Native component sink is outside its captured public contract.'); }
        else (kind === 'attributes' ? native.assertNativeAttributeName : native.assertNativePropertyName)(name);
        if (kind === 'properties' && name === 'id') invalid('Native DOM ids require the canonical attributes.id sink.');
        const structured = managed && component && kind === 'properties' && ['object','array','json'].includes(component.properties[name].type);
        marker(value, context.repeat, table, structured);
        if (managed && component && value.op === 'literal') validateComponentValues(component,{[kind]:{[name]:value.value}});
        if (name === 'id') {
          if (context.repeat.length || value.op !== 'literal') invalid('DOM ids require a static, unrepeated native element.');
          native.assertNativeDomId(value.value);
          if (value.value !== null) { if (domIds.has(value.value)) invalid('Native DOM ids must be unique.'); domIds.add(value.value); }
        }
      }
    }
  }
  function visit(node, context = { owner: null, repeat: [] }, depth = 0) {
    if (depth > 64 || ++count > 50000) invalid('Native View exceeds its explicit node/depth budget.');
    if (Array.isArray(node)) { node.forEach(child => visit(child, context, depth + 1)); return; }
    if (!node || typeof node !== 'object') invalid('Native programs require explicit tracked nodes.');
    if (typeof node.surface === 'string') {
      if (context.guarded) invalid('Native branches cannot own independent Surface lifetimes.');
      const definition = table.surfaces.get(node.surface);
      if (!definition || !['element', 'component'].includes(node.type) || node.tag !== definition.component
        || node.component !== undefined && node.component !== definition.component || node.type === 'component' && node.component !== definition.component)
        invalid('Native Surface wrapper must match its declared component.');
      fields(node, ['type', 'id', 'surface', 'component', 'tag', 'key', 'attributes', 'parts', 'styleTokens', 'bindings', 'children'], 'Native Surface wrapper');
      if (node.key !== node.surface || node.id !== undefined && node.id !== 'surface:' + node.surface || surfaces.has(node.surface)) invalid('Native Surface identities must be unique compiler-owned declarations.');
      surfaces.add(node.surface);
      const expected = { 'data-rmt-surface': node.surface, 'data-maraca-surface': node.surface,
        'data-rmt-primitive-id': node.surface, 'data-rmt-component': definition.component, 'data-maraca-kind': definition.kind || 'surface' };
      fields(node.attributes, [...Object.keys(expected), 'data-action', 'data-label', 'id', 'tone'], 'Native Surface marker attributes');
      if (node.attributes.id !== undefined || node.attributes.tone !== undefined) invalid('Native Surface optional legacy id/tone sinks must remain absent.');
      for (const [name, value] of Object.entries(expected)) {
        const actual = node.attributes[name];
        if (!actual || actual.op !== 'literal' || actual.value !== value || Object.keys(actual).length !== 2) invalid('Native Surface markers must retain compiler-owned identity.');
      }
      const eventAction = (program.events || []).find(event => (definition.events || []).includes(event.id))?.action?.split('.').filter(Boolean).pop();
      for (const name of ['data-action', 'data-label']) if (Object.hasOwn(node.attributes, name) && (!eventAction || node.attributes[name] !== eventAction)) invalid('Native Surface action markers must match their compiled event.');
      if (!same(node.bindings || [], definition.events || [])) invalid('Native Surface events must match their compiled declaration.');
      if (node.children !== undefined && !Array.isArray(node.children) || voidTags.has(definition.component) && node.children?.length) invalid('Invalid native Surface children.');
      if (header.surfaces.includes(node.surface)) owners.add(node.surface);
      const ownScope = scopeMap.get(node.surface);
      if (context.owner && ownScope.parentId && ownScope.parentId !== context.owner) invalid('Physical and logical native Surface parent authorities conflict.');
      if (node.children) visit(node.children, { owner: node.surface, repeat: ownScope.repeat || [] }, depth + 1);
      return;
    }
    if (!Object.hasOwn(node, 'nativeDeclarationId')) {
      if (node.type !== 'fragment') invalid('Native programs cannot contain untracked legacy nodes.');
      fields(node, ['type', 'children'], 'Native fragment');
      if (!Array.isArray(node.children)) invalid('Native fragments require children arrays.');
      visit(node.children, context, depth + 1); return;
    }
    if (!context.owner || !header.surfaces.includes(context.owner)) invalid('Native nodes require a declared native View owner.');
    declaration(node);
    if (node.type === 'native-repeat') {
      fields(node, ['type', 'nativeDeclarationId', 'repeat', 'children'], 'Native repeat'); validateRepeat(node.repeat);
      if (node.repeat.length !== context.repeat.length + 1 || !same(node.repeat.slice(0, -1), context.repeat) || !table.states.has(node.repeat[0].state)) invalid('Native repeats must extend their exact declared parent chain.');
      if (!Array.isArray(node.children)) invalid('Native repeat children require arrays.');
      visit(node.children, { ...context, repeat: node.repeat, guarded: true }, depth + 1); return;
    }
    if (node.type === 'native-when') {
      fields(node, ['type', 'nativeDeclarationId', 'test', 'children'], 'Native condition'); expression(node.test, context.repeat, table);
      if (node.test.kind === 'literal' && typeof node.test.value !== 'boolean' || !Array.isArray(node.children)) invalid('Native conditions require Boolean guards and children arrays.');
      visit(node.children, { ...context, guarded: true }, depth + 1); return;
    }
    if (node.type === 'text') { fields(node, ['type', 'nativeDeclarationId', 'value'], 'Native text'); marker(node.value, context.repeat, table); return; }
    if (node.type === 'native-component') {
      fields(node, ['type', 'nativeDeclarationId', 'tag', 'attributes', 'properties', 'slots', ...(managed ? ['ref','events'] : [])], 'Native component');
      const component = table.components.get(node.tag);
      if (!component || !Array.isArray(node.slots)) invalid('Native components require captured shipped metadata and explicit slots.');
      sinks(node, context, component);
      const names = new Set();
      for (const slot of node.slots) {
        fields(slot, ['type', 'name', 'nativeDeclarationId', 'children'], 'Native public slot');
        if (slot.type !== 'native-slot' || !component.slots.includes(slot.name) || names.has(slot.name) || !Array.isArray(slot.children)) invalid('Native slots must match distinct captured public slot names.');
        names.add(slot.name); declaration(slot); visit(slot.children, context, depth + 1);
      }
      return;
    }
    if (node.type !== 'element' || !tags.has(node.tag)) invalid('Native Views require closed HTML elements, public components or text.');
    fields(node, ['type', 'nativeDeclarationId', 'tag', 'attributes', 'properties', 'children',...(managed?['ref']:[])], 'Native element');
    if(managed&&node.ref!==undefined&&(typeof node.ref!=='string'||!/^[A-Za-z][A-Za-z0-9_-]*$/.test(node.ref)))invalid('Native HTML refs require a local source ref.');
    if (!Array.isArray(node.children) || voidTags.has(node.tag) && node.children.length) invalid('Invalid native element children.');
    sinks(node, context, null); visit(node.children, context, depth + 1);
  }
  visit(root);
  if (header.surfaces.some(id => !owners.has(id)) || [...table.surfaces.keys()].some(id => !surfaces.has(id))) invalid('Each native Surface requires exactly one compiled wrapper.');
}
function validateNativeSurfaceViewProgram(input) {
  try {
    assertNativeCanonicalData(input, true);
    if (input?.schema !== programSchema) invalid('Native Surface View requires exact Program5.');
    const header = input.render?.nativeView;
    fields(header, ['schema', 'documentId', 'surfaces', 'components', 'scopes', 'eventKeys', ...(managed ? ['bindings','events','commands'] : [])], 'Native Surface View header');
    if (header.schema !== NATIVE_SURFACE_VIEW_SCHEMA || !Array.isArray(header.surfaces) || !Array.isArray(header.components) || !Array.isArray(header.scopes) || !Array.isArray(header.eventKeys)
      || new Set(header.surfaces).size !== header.surfaces.length) invalid('Native Surface View requires its exact Header2.');
    name(header.documentId); header.surfaces.forEach(name);
    if (managed) validateComponentBindings(input);
    const table = symbols(input);
    if (header.surfaces.some(id => !table.surfaces.has(id))) invalid('Native View owner is undeclared.');
    scopes.validateNativeSurfaceScopes(input);
    lifecycle.validateNativeOrchestrationLifecyclePlan(input);
    validateRoot(input.render.root, input, table);
    const result = freeze(clone(input)); validated.add(result); return result;
  } catch (error) { if (error.code === 'rmt.native-view.invalid') throw error; invalid(error.message); }
}

return {NATIVE_SURFACE_VIEW_API_VERSION,NATIVE_SURFACE_VIEW_SCHEMA,validateNativeSurfaceViewProgram,validateRoot,symbols,key,scalar,invalid,validated,booleanProperties,booleanAttributes};
}
module.exports={createNativeSurfaceViewValidation};
