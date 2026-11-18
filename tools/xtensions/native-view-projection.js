// SPDX-License-Identifier: Apache-2.0
'use strict';

const { data, fields, name, segments, bindingPath, clone, freeze } = require('./state-binding-contract');
const { assertNativeCanonicalData } = require('./native-data');
const projections = require('./state-binding-projection');
const { validateRepeat, templatePath, expandRepeatScopes } = require('./repeat-scopes');

const NATIVE_VIEW_PROJECTION_API_VERSION = '1.0.0';
const NATIVE_VIEW_SCHEMA = 'xtend.rmt.native-view.v1';
const NATIVE_VIEW_MAX_KEY_LENGTH = 4096;
const NATIVE_VIEW_TAG_NAMES = Object.freeze(('a abbr address article aside audio b bdi bdo blockquote br button caption code col colgroup data datalist dd del details dfn dialog div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr i img input ins kbd label legend li main mark menu meter nav ol optgroup option output p picture pre progress q rp rt ruby s samp section select small source span strong sub summary sup table tbody td textarea tfoot th thead time tr track u ul var video wbr').split(' '));
const NATIVE_VIEW_PROPERTY_NAMES = Object.freeze(('value checked disabled selected readOnly required multiple indeterminate tabIndex title placeholder name type id open').split(' '));
const NATIVE_VIEW_VOID_TAG_NAMES = Object.freeze('br col hr img input source track wbr'.split(' '));
const tags = new Set(NATIVE_VIEW_TAG_NAMES), properties = new Set(NATIVE_VIEW_PROPERTY_NAMES), voidTags = new Set(NATIVE_VIEW_VOID_TAG_NAMES);
const blockedAttributes = new Set(['style', 'slot', 'part', 'srcdoc', 'innerhtml', 'outerhtml', 'insertadjacenthtml', '__proto__', 'prototype', 'constructor', 'srcset']);
const booleanProperties = new Set('checked disabled selected readOnly required multiple indeterminate open'.split(' '));
const booleanAttributes = new Set('hidden disabled checked selected readonly required multiple open autofocus novalidate controls autoplay loop muted inert reversed'.split(' '));
const validated = new WeakSet();

function assertNativeAttributeName(value) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*$/u.test(value) || value.startsWith('on') || blockedAttributes.has(value)
      || ['data-rmt-', 'data-rmtx-', 'data-maraca-', 'data-xt-', 'data-xtend-'].some(prefix => value.startsWith(prefix))) throw new TypeError('Native attributes require safe static names without internal markers or executable sinks.');
}
function assertNativePropertyName(value) {
  if (!properties.has(value)) throw new TypeError('Native properties require the declared closed property names.');
}
function assertNativeDomId(value) {
  if (value !== null && (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/u.test(value))) throw new TypeError('Native DOM ids require a static selector-safe string or null.');
}
function invalid(message) {
  const error = new TypeError(message); error.code = 'rmt.native-view.invalid'; throw error;
}
function symbolMap(entries, label) {
  if (!Array.isArray(entries)) invalid(`Native View requires declared ${label} symbols.`);
  const names = new Set();
  for (const entry of entries) { name(entry?.id); if (names.has(entry.id)) invalid(`Duplicate native ${label} symbol.`); names.add(entry.id); }
  return names;
}
function nativeKey(documentId, declarationId, keys) {
  segments(keys);
  // The renderer trims keys but never truncates them. Tuple encoding has no
  // surrounding whitespace and preserves key types and segment boundaries.
  const key = JSON.stringify([documentId, declarationId, keys]);
  if (key.length > NATIVE_VIEW_MAX_KEY_LENGTH) invalid('Native DOM key exceeds its explicit 4096-code-unit limit.');
  return key;
}
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function mapScopeProjection(expression, repeat, keys) {
  return projections.mapProjection(expression, node => ({ ...node,
    path: templatePath({ state: node.symbol, path: node.path }, { repeat }, keys) }));
}
function validateExpression(expression, repeat, symbols) {
  projections.visitProjection(expression, node => {
    if (node.kind === 'object' || node.kind === 'array') invalid('Native sinks require scalar projection IR.');
    if (node.kind === 'literal') scalar(node.value, 'Native projection literal');
    if (node.kind !== 'path') return;
    if (!(node.root === 'state' ? symbols.states : symbols.selectors).has(node.symbol)) invalid('Native projection references an undeclared Model/selector symbol.');
    for (const part of node.path) {
      if (part && typeof part === 'object') fields(part, ['repeat'], 'Native scope path');
      else segments([part]);
    }
  });
  projections.validateProjection(mapScopeProjection(expression, repeat, (repeat || []).map(() => 'native-template-key')));
}
function validateValue(value, repeat, symbols) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Native sinks require explicit literal or closed projection markers.');
  if (value.op === 'literal') {
    fields(value, ['op', 'value'], 'Native literal'); scalar(value.value, 'Native literal');
  } else if (value.op === 'native-projection') {
    fields(value, ['op', 'projection'], 'Native projection marker'); validateExpression(value.projection, repeat, symbols);
  } else invalid('Unknown native sink marker.');
}
function scalar(value, label) {
  if (value !== null && !['string', 'boolean', 'number'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)) invalid(`${label} requires a finite scalar or null.`);
  return value;
}
function validateRoot(root, header, symbols) {
  const declarations = new Set(), owners = new Set(), domIds = new Set(), surfaceCounts = new Map();
  let count = 0;
  function visit(value, context = { repeat: [], owner: null }, depth = 0) {
    if (depth > 64 || ++count > 50000) invalid('Native View exceeds its closed depth/node budget.');
    if (Array.isArray(value)) { value.forEach(child => visit(child, context, depth + 1)); return; }
    if (!value || typeof value !== 'object') invalid('Native programs require explicit tracked nodes, not raw primitive descriptors.');
    if (typeof value.surface === 'string') {
      if (context.guarded) invalid('Native branches cannot implicitly control independently orchestrated Surface targets.');
      const definition = symbols.surfaces.get(value.surface);
      if (!definition || !tags.has(definition.component) || !['element', 'component'].includes(value.type)
          || value.tag !== definition.component || value.component !== undefined && value.component !== definition.component
          || value.type === 'component' && value.component !== definition.component) invalid('Native Surface wrappers must match their declared safe HTML component and tag.');
      fields(value, ['type', 'id', 'surface', 'component', 'tag', 'key', 'attributes', 'parts', 'styleTokens', 'bindings', 'children'], 'Native Surface wrapper');
      if (value.key !== value.surface || value.id !== undefined && value.id !== `surface:${value.surface}`) invalid('Native Surface keys and diagnostic ids are compiler-owned.');
      const expected = { 'data-rmt-surface': value.surface, 'data-maraca-surface': value.surface,
        'data-rmt-primitive-id': value.surface, 'data-rmt-component': definition.component, 'data-maraca-kind': definition.kind || 'surface' };
      if (!value.attributes || typeof value.attributes !== 'object' || Array.isArray(value.attributes)) invalid('Native Surface wrappers require their compiler-owned marker attributes.');
      for (const [name, marker] of Object.entries(expected)) {
        const actual = value.attributes[name];
        if (!actual || typeof actual !== 'object' || actual.op !== 'literal' || actual.value !== marker || Object.keys(actual).length !== 2) invalid('Native Surface marker attributes must match their declared identity.');
      }
      if (value.attributes.id !== undefined) invalid('Native Surface DOM ids are not an authoring sink; use a static native element.');
      if (!same(value.bindings || [], definition.events || [])) invalid('Native Surface event binding references are compiler-owned.');
      if (value.children !== undefined && !Array.isArray(value.children)) invalid('Native Surface wrapper children must be an array.');
      if (voidTags.has(definition.component) && value.children?.length) invalid('Native void Surface wrappers cannot have children.');
      surfaceCounts.set(value.surface, (surfaceCounts.get(value.surface) || 0) + 1);
      if (surfaceCounts.get(value.surface) !== 1) invalid('Native Surface render wrappers must be unique.');
    }
    const owner = typeof value.surface === 'string' ? value.surface : context.owner;
    if (typeof value.surface === 'string' && header.surfaces.includes(value.surface)) owners.add(value.surface);
    const native = Object.hasOwn(value, 'nativeDeclarationId');
    if (!native && typeof value.surface !== 'string') {
      if (value.type !== 'fragment') invalid('Native programs cannot contain untracked legacy DOM or template nodes.');
      fields(value, ['type', 'children'], 'Native composition fragment');
      if (!Array.isArray(value.children)) invalid('Native composition fragments require children arrays.');
    }
    if (native || ['native-repeat', 'native-when'].includes(value.type)) {
      // Compiler-owned Surface descendants retain optional in-memory fields.
      // The whole program is descriptor-validated before this grammar walk.
      data(value, new Set(), true); name(value.nativeDeclarationId);
      if (!owner || !header.surfaces.includes(owner)) invalid('Native nodes require a declared owning native Surface.');
      if (declarations.has(value.nativeDeclarationId)) invalid('Native node declarations must be unique across the compiled document.');
      declarations.add(value.nativeDeclarationId);
      if (value.type === 'native-repeat') {
        fields(value, ['type', 'nativeDeclarationId', 'repeat', 'children'], 'Native repeat');
        validateRepeat(value.repeat);
        if (value.repeat.length !== context.repeat.length + 1 || !same(value.repeat.slice(0, -1), context.repeat)) invalid('Nested native repeats must extend their exact parent scope chain.');
        if (!symbols.states.has(value.repeat[0].state)) invalid('Native repeat references an undeclared Model state.');
        if (!Array.isArray(value.children)) invalid('Native repeat children must be an array.');
        visit(value.children, { owner, repeat: value.repeat, guarded: true }, depth + 1); return;
      }
      if (value.type === 'native-when') {
        fields(value, ['type', 'nativeDeclarationId', 'test', 'children'], 'Native when'); validateExpression(value.test, context.repeat, symbols);
        if (value.test.kind === 'literal' && typeof value.test.value !== 'boolean') invalid('Native conditions require a boolean, not truthiness.');
        if (!Array.isArray(value.children)) invalid('Native when children must be an array.');
        visit(value.children, { ...context, owner, guarded: true }, depth + 1); return;
      }
      if (value.type === 'text') {
        fields(value, ['type', 'nativeDeclarationId', 'value'], 'Native text'); validateValue(value.value, context.repeat, symbols); return;
      }
      if (value.type !== 'element' || !tags.has(value.tag)) invalid('Native View requires a declared safe HTML element or text node.');
      fields(value, ['type', 'nativeDeclarationId', 'tag', 'attributes', 'properties', 'children'], 'Native element');
      if (!Array.isArray(value.children)) invalid('Native element children must be an array.');
      if (voidTags.has(value.tag) && value.children.length) invalid('Native void elements cannot have children.');
      for (const [kind, values] of [['attributes', value.attributes === undefined ? {} : value.attributes], ['properties', value.properties === undefined ? {} : value.properties]]) {
        fields(values, Object.keys(values), 'Native sink map');
        for (const [key, expression] of Object.entries(values)) {
          (kind === 'attributes' ? assertNativeAttributeName : assertNativePropertyName)(key);
          if (kind === 'properties' && key === 'id') invalid('Compiled Native DOM ids require the canonical attributes.id sink.');
          if (key === 'id' && context.repeat.length) invalid('Repeated native elements cannot declare DOM ids.');
          validateValue(expression, context.repeat, symbols);
          if (key === 'id' && expression.op !== 'literal') invalid('Native DOM ids require static literal values for portal composition.');
          if (key === 'id' && expression.op === 'literal' && expression.value !== null) {
            assertNativeDomId(expression.value);
            if (domIds.has(expression.value)) invalid('Native DOM ids require distinct nonempty strings.');
            domIds.add(expression.value);
          }
        }
      }
    }
    // Existing Surface descriptors and portal composition keep their current
    // fields and authority. Only children contain the new Native View grammar.
    if (value.children) visit(value.children, { ...context, owner }, depth + 1);
    if (!native) for (const key of ['then', 'else', 'template', 'node', 'child', 'content', 'fallback', 'descriptors', 'nodes']) {
      if (value[key] && typeof value[key] === 'object') visit(value[key], { ...context, owner }, depth + 1);
    }
  }
  visit(root);
  if (header.surfaces.some(id => !owners.has(id))) invalid('Each native Surface requires its own compiled render descriptor.');
}

/** Pure validation; neither provider code nor a DOM operation is executed. */
function validateNativeViewProgram(program) {
  try {
    assertNativeCanonicalData(program, true);
    if (program?.schema !== 'xtend.rmt.app-orchestration.v3') invalid('Native View requires its explicitly versioned orchestration program v3.');
    const header = program.render?.nativeView;
    data(header); fields(header, ['schema', 'documentId', 'surfaces'], 'Native View header');
    if (header.schema !== NATIVE_VIEW_SCHEMA) invalid('Unsupported Native View schema.');
    name(header.documentId);
    if (!Array.isArray(header.surfaces) || new Set(header.surfaces).size !== header.surfaces.length) invalid('Native View requires unique owning Surfaces.');
    header.surfaces.forEach(name);
    const symbols = { states: symbolMap(program.state?.states || [], 'state'), selectors: symbolMap(program.state?.selectors || [], 'selector') };
    const surfaces = symbolMap(program.surfaces || [], 'Surface');
    symbols.surfaces = new Map((program.surfaces || []).map(surface => {
      if (!tags.has(surface.component)) invalid('Native Surface declarations require a safe HTML component.');
      return [surface.id, surface];
    }));
    if (header.surfaces.some(id => !surfaces.has(id))) invalid('Native View references an undeclared owning Surface.');
    validateRoot(program.render.root, header, symbols);
    const result = freeze(clone(program)); validated.add(result); return result;
  } catch (error) { if (error.code === 'rmt.native-view.invalid') throw error; invalid(error.message); }
}
function modelSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) || ![Object.prototype, null].includes(Object.getPrototypeOf(snapshot))) invalid('Native View requires a plain Model snapshot.');
  const result = {};
  for (const key of ['states', 'selectors']) {
    const descriptor = Object.getOwnPropertyDescriptor(snapshot, key);
    if (!descriptor && key === 'selectors') continue;
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) invalid('Native Model/selector snapshots cannot be accessors.');
    fields(descriptor.value, Object.keys(descriptor.value || {}), `Native ${key}`); assertNativeCanonicalData(descriptor.value); result[key] = descriptor.value;
  }
  return result;
}

/** Materialize only declarative data; shared renderer remains the sole DOM writer. */
function materializeNativeView(input, snapshot, root) {
  const program = validated.has(input) ? input : validateNativeViewProgram(input);
  const header = program.render.nativeView;
  root = root === undefined ? program.render.root : root;
  try {
    const current = modelSnapshot(snapshot);
    assertNativeCanonicalData(root, true);
    const symbols = { states: symbolMap(program.state?.states || [], 'state'), selectors: symbolMap(program.state?.selectors || [], 'selector'),
      surfaces: new Map((program.surfaces || []).map(surface => [surface.id, surface])) };
    validateRoot(root, header, symbols);
    const keys = new Set(), ids = new Set();
    function value(marker, context) {
      const resolved = marker.op === 'literal' ? marker.value : projections.evaluateProjection(mapScopeProjection(marker.projection, context.repeat, context.keys), current);
      return scalar(resolved, 'Native sink');
    }
    function sink(marker, kind, key, context) {
      const result = value(marker, context);
      if (result !== null && ((kind === 'properties' && booleanProperties.has(key) || kind === 'attributes' && booleanAttributes.has(key)) && typeof result !== 'boolean')) invalid('Native boolean sinks require a boolean or null.');
      if (kind === 'properties' && result !== null) {
        if (key === 'tabIndex' && !Number.isSafeInteger(result)) invalid('Native tabIndex requires a safe integer or null.');
        if (!booleanProperties.has(key) && key !== 'tabIndex' && key !== 'value' && typeof result !== 'string') invalid('Native string properties require a string or null.');
        if (key === 'value' && !['string', 'number'].includes(typeof result)) invalid('Native value requires a string, finite number or null.');
      }
      if (key === 'id' && result !== null) {
        if (typeof result !== 'string' || !result || ids.has(result)) invalid('Native DOM ids require distinct nonempty strings.'); ids.add(result);
      }
      return { op: 'literal', value: result };
    }
    function project(node, context = { repeat: [], keys: [], item: null }) {
      if (Array.isArray(node)) return node.flatMap(child => { const result = project(child, context); return Array.isArray(result) ? result : [result]; });
      if (!node || typeof node !== 'object') return node;
      const declaration = node.nativeDeclarationId;
      if (!declaration) {
        const result = { ...node };
        for (const key of ['children', 'then', 'else', 'template', 'node', 'child', 'content', 'fallback', 'descriptors', 'nodes']) if (node[key] && typeof node[key] === 'object') result[key] = project(node[key], context);
        return result;
      }
      if (node.type === 'native-repeat') {
        const rows = [];
        expandRepeatScopes(node.repeat, current, (keys, item) => rows.push(...project(node.children, { repeat: node.repeat, keys, item })), { level: context.repeat.length, keys: context.keys, item: context.item });
        return rows;
      }
      if (node.type === 'native-when') {
        const test = projections.evaluateProjection(mapScopeProjection(node.test, context.repeat, context.keys), current);
        if (typeof test !== 'boolean') invalid('Native conditions require a boolean, not truthiness.');
        return test ? project(node.children, context) : [];
      }
      const key = nativeKey(header.documentId, declaration, context.keys);
      if (keys.has(key)) invalid('Materialized native DOM identities must be unique.'); keys.add(key);
      if (node.type === 'text') return { type: 'text', text: { op: 'literal', value: value(node.value, context) }, key: { op: 'literal', value: key } };
      const result = { type: 'element', tag: node.tag, key: { op: 'literal', value: key }, attributes: {}, properties: {}, children: [] };
      for (const kind of ['attributes', 'properties']) for (const [name, marker] of Object.entries(node[kind] || {})) result[kind][name] = sink(marker, kind, name, context);
      result.children = project(node.children, context); return result;
    }
    return freeze(project(clone(root)));
  } catch (error) { if (error.code === 'rmt.native-view.invalid') throw error; invalid(error.message); }
}

module.exports = { NATIVE_VIEW_PROJECTION_API_VERSION, NATIVE_VIEW_SCHEMA, NATIVE_VIEW_MAX_KEY_LENGTH, NATIVE_VIEW_TAG_NAMES, NATIVE_VIEW_PROPERTY_NAMES, NATIVE_VIEW_VOID_TAG_NAMES,
  assertNativeAttributeName, assertNativePropertyName, assertNativeDomId, assertNativeCanonicalData, validateNativeViewProgram, materializeNativeView };
