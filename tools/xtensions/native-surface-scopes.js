// SPDX-License-Identifier: Apache-2.0
'use strict';

// Source7 instance identities are projections of the existing typed key engine.
// This module neither allocates generations nor writes Controller/DOM state.
const { fields, name, segments, bindingPath, readBindingPath, clone, freeze } = require('./state-binding-contract');
const { assertNativeCanonicalData } = require('./native-data');
const { validateRepeat, templatePath, expandRepeatScopes } = require('./repeat-scopes');
const projections = require('./state-binding-projection');
const { nativeLifecycleParents } = require('./native-lifecycle');
const NATIVE_SURFACE_SCOPES_API_VERSION = '1.0.0';
const NATIVE_SURFACE_SCOPES_SCHEMA = 'xtend.rmt.native-surface-scopes.v1';
const NATIVE_SURFACE_MATERIALIZATION_SCHEMA = 'xtend.rmt.native-surface-materialization.v1';
const MAX_NATIVE_SURFACE_ID_LENGTH = 4096;
const MAX_NATIVE_SURFACE_INSTANCES = 10000;
const symbol = /^[A-Za-z_$][\w$-]*(?:\.[A-Za-z_$][\w$-]*)*$/u;
const validated = new WeakMap();
function invalid(message) { throw Object.assign(new TypeError(message), { code: 'rmt.native-surface.invalid' }); }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function deepFrozen(value) { return !value || typeof value !== 'object' || Object.isFrozen(value) && Object.values(value).every(deepFrozen); }
function nativeSurfaceScopeKey(documentId, declaration, keys) {
  name(documentId); name(declaration); assertNativeCanonicalData(keys); segments(keys);
  const value = 'rmtx:' + JSON.stringify([documentId, declaration, keys]);
  if (declaration.length + value.length + 1 > MAX_NATIVE_SURFACE_ID_LENGTH) invalid('Native Surface identity exceeds its explicit limit; identities are never truncated.');
  return value;
}
function nativeSurfaceInstanceId(documentId, declaration, keys) {
  name(documentId); name(declaration); assertNativeCanonicalData(keys); segments(keys);
  return keys.length ? declaration + ':' + nativeSurfaceScopeKey(documentId, declaration, keys) : declaration;
}
function validateNativeSurfaceScopes(program) {
  if (validated.has(program)) return validated.get(program);
  assertNativeCanonicalData(program, true);
  if (program?.schema !== 'xtend.rmt.app-orchestration.v5' || program.render?.nativeView?.schema !== 'xtend.rmt.native-view.v2')
    invalid('Native Surface scopes require their exact Program5/Header2 contract.');
  const header = program.render.nativeView;
  name(header.documentId);
  if (!Array.isArray(program.surfaces) || !Array.isArray(header.scopes) || header.scopes.length > 256) invalid('Native Surface scopes require bounded declarations.');
  const definitions = new Map();
  for (const definition of program.surfaces) {
    name(definition.id);
    if (!symbol.test(definition.id) || definitions.has(definition.id)) invalid('Source7 Surface declarations require unique source symbols; concrete identity namespaces are reserved.');
    definitions.set(definition.id, definition);
  }
  const declarations = new Map();
  for (const entry of header.scopes) {
    fields(entry, ['surface', 'repeat', 'presence', 'parent', 'placement'], 'Native Surface scope');
    if (!definitions.has(entry.surface) || declarations.has(entry.surface)) invalid('Native Surface scopes require one known declaration.');
    if (!Object.hasOwn(entry, 'repeat') && !Object.hasOwn(entry, 'presence') && !Object.hasOwn(entry, 'parent')) invalid('A Surface scope must declare repeat, presence or a logical parent.');
    if (entry.parent !== undefined) { name(entry.parent); if (!definitions.has(entry.parent) || entry.parent === entry.surface) invalid('Native Surface parent must name another declared Surface.'); }
    if (entry.placement !== undefined && !['nested', 'portal'].includes(entry.placement)) invalid('Native Surface placement must be nested or portal.');
    validateRepeat(entry.repeat);
    if (entry.repeat?.length > 32) invalid('Native Surface scopes exceed their explicit nesting limit.');
    for (const scope of entry.repeat || []) if (scope.path.some(part => typeof part !== 'string') || scope.key.some(part => typeof part !== 'string')) invalid('Surface repeat collections and key selectors require direct named paths.');
    if (Object.hasOwn(entry, 'presence')) {
      fields(entry.presence, ['state', 'path'], 'Native Surface presence'); name(entry.presence.state);
      if (!Array.isArray(entry.presence.path)) invalid('Native Surface presence requires a path.');
      bindingPath(templatePath(entry.presence, entry, (entry.repeat || []).map(() => 'surface-template-key')), true);
    }
    declarations.set(entry.surface, entry);
  }
  const states = new Set((program.state?.states || []).map(state => state.id));
  for (const entry of declarations.values()) {
    if (entry.repeat?.length && !states.has(entry.repeat[0].state) || entry.presence && !states.has(entry.presence.state)) invalid('Surface scopes reference an undeclared Model state.');
  }
  const parents = Object.assign(Object.create(null), nativeLifecycleParents(program)), active = new Set(), normalized = new Map();
  for (const entry of declarations.values()) if (entry.parent) {
    if (parents[entry.surface] && parents[entry.surface] !== entry.parent) invalid('Native Surface lexical and physical parent authorities conflict.');
    parents[entry.surface] = entry.parent;
  }
  function visit(id) {
    if (normalized.has(id)) return normalized.get(id);
    if (active.has(id)) invalid('Native Surface parent scopes cannot cycle.');
    active.add(id);
    const parentId = parents[id];
    if (parentId && !definitions.has(parentId)) invalid('Native Surface parent must reference a declared Surface.');
    const parent = parentId ? visit(parentId) : null, own = declarations.get(id), repeat = own?.repeat || parent?.repeat;
    if (parent?.repeat?.length && (!repeat || repeat.length < parent.repeat.length || !same(repeat.slice(0, parent.repeat.length), parent.repeat)))
      invalid('Nested native Surface repeats must retain their exact typed parent scope prefix.');
    const result = { surface: id, ...(repeat ? { repeat: clone(repeat) } : {}), ...(own?.presence ? { presence: clone(own.presence) } : {}), ...(parentId ? { parentId } : {}), ...(own?.placement ? { placement: own.placement } : {}) };
    normalized.set(id, result); active.delete(id); return result;
  }
  for (const id of definitions.keys()) visit(id);
  const result = freeze({ schema: NATIVE_SURFACE_SCOPES_SCHEMA, documentId: header.documentId, declarations: [...normalized.values()] });
  if (deepFrozen(program)) validated.set(program, result); return result;
}
function resolveNativeSurfaceInstance(program, declaration, keys = []) {
  const contract = validateNativeSurfaceScopes(program), scope = contract.declarations.find(entry => entry.surface === declaration);
  if (!scope) invalid('Cannot resolve an undeclared native Surface.');
  assertNativeCanonicalData(keys); segments(keys);
  if (keys.length !== (scope.repeat?.length || 0)) invalid('Concrete Surface keys must match the exact declaration scope depth.');
  return nativeSurfaceInstanceId(contract.documentId, declaration, keys);
}
function findNativeSurfaceInstance(materialization, declaration, keys = []) {
  if (materialization?.schema !== NATIVE_SURFACE_MATERIALIZATION_SCHEMA) invalid('Expected the native Surface materialization contract.');
  assertNativeCanonicalData(keys); segments(keys);
  const rows = materialization.instances.filter(row => row.surfaceId === declaration && same(row.keys, keys));
  if (rows.length > 1) invalid('Native Surface addresses must be unique.');
  return rows[0] || null;
}
function scopeNativeProjection(expression, instance) {
  assertNativeCanonicalData(expression); assertNativeCanonicalData(instance, true);
  return projections.mapProjection(expression, node => ({ ...node, path: templatePath({ state: node.symbol, path: node.path }, instance, instance.keys) }));
}
function evaluateNativeSurfaceProjection(expression, instance, snapshot) {
  return projections.evaluateProjection(scopeNativeProjection(expression, instance), snapshot);
}
function materializeNativeSurfaceScopes(program, snapshot) {
  const contract = validateNativeSurfaceScopes(program);
  assertNativeCanonicalData(snapshot, true);
  if (!snapshot?.states || typeof snapshot.states !== 'object') invalid('Native Surface materialization requires a Model snapshot.');
  const entries = new Map(contract.declarations.map(entry => [entry.surface, entry])), bySurface = new Map(), ids = new Set(), instances = [];
  function rows(surface) {
    if (bySurface.has(surface)) return bySurface.get(surface);
    const scope = entries.get(surface), parentRows = scope.parentId ? rows(scope.parentId) : null, result = [];
    if (parentRows && !parentRows.length) { bySurface.set(surface, result); return result; }
    const expand = parent => expandRepeatScopes(scope.repeat, snapshot, (keys, record) => {
      const parentScope = scope.parentId && entries.get(scope.parentId);
      const parentKeys = keys.slice(0, parentScope?.repeat?.length || 0);
      const parent = parentRows?.find(row => same(row.keys, parentKeys));
      if (parentRows && !parent) return;
      if (scope.presence) {
        const value = readBindingPath(snapshot.states[scope.presence.state], templatePath(scope.presence, scope, keys));
        if (typeof value !== 'boolean') invalid('Native Surface presence requires a Boolean, not truthiness.');
        if (!value) return;
      }
      const id = nativeSurfaceInstanceId(contract.documentId, surface, keys);
      if (ids.has(id) || instances.length >= MAX_NATIVE_SURFACE_INSTANCES) invalid('Native Surface materialization exceeds its identity or instance limit.');
      ids.add(id);
      const row = { id, surfaceId: surface, keys: keys.slice(), ...(scope.repeat ? { repeat: clone(scope.repeat) } : {}), ...(parent ? { parentId: parent.id } : {}), record: record === undefined ? null : clone(record) };
      result.push(row); instances.push(row);
    }, parent?.repeat?.length ? { level: parent.repeat.length, keys: parent.keys, item: parent.record } : {});
    if (parentRows) parentRows.forEach(expand); else expand(null);
    bySurface.set(surface, result); return result;
  }
  for (const entry of contract.declarations) rows(entry.surface);
  return freeze({ schema: NATIVE_SURFACE_MATERIALIZATION_SCHEMA, documentId: contract.documentId, instances });
}
function validateNativeSurfaceMaterialization(program, input) {
  const contract = validateNativeSurfaceScopes(program), declarations = new Map(contract.declarations.map(entry => [entry.surface, entry]));
  assertNativeCanonicalData(input);
  fields(input, ['schema', 'documentId', 'instances'], 'Native Surface materialization');
  if (input.schema !== NATIVE_SURFACE_MATERIALIZATION_SCHEMA || input.documentId !== contract.documentId || !Array.isArray(input.instances) || input.instances.length > MAX_NATIVE_SURFACE_INSTANCES)
    invalid('Native Surface materialization must retain its declared document and bounded instance list.');
  const ids = new Set();
  for (const row of input.instances) {
    fields(row, ['id', 'surfaceId', 'keys', 'repeat', 'parentId', 'record'], 'Concrete native Surface');
    const declaration = declarations.get(row.surfaceId);
    if (!declaration || !Array.isArray(row.keys)) invalid('Concrete Surface requires its known source declaration and typed keys.');
    segments(row.keys);
    if (row.keys.length !== (declaration.repeat?.length || 0) || !same(row.repeat || [], declaration.repeat || [])) invalid('Concrete Surface repeat scope differs from its source declaration.');
    if (row.id !== nativeSurfaceInstanceId(contract.documentId, row.surfaceId, row.keys) || ids.has(row.id)) invalid('Concrete Surface ids must be distinct compiler-owned typed tuples.');
    const parent = declaration.parentId && declarations.get(declaration.parentId);
    if (row.parentId !== (parent ? nativeSurfaceInstanceId(contract.documentId, parent.surface, row.keys.slice(0, parent.repeat?.length || 0)) : undefined)) invalid('Concrete Surface parent must retain the exact scope key prefix.');
    if (declaration.repeat?.length && readBindingPath(row.record, declaration.repeat.at(-1).key) !== row.keys.at(-1)) invalid('Concrete Surface record and typed item key differ.');
    ids.add(row.id);
  }
  for (const row of input.instances) if (row.parentId && !ids.has(row.parentId)) invalid('Concrete Surface parent is absent from the same materialization.');
  return freeze(clone(input));
}
function concreteSurfaceSelector(id) {
  return '[data-rmt-surface="' + String(id).replace(/\\/gu, '\\\\').replace(/"/gu, '\\"') + '"]';
}
function materializeNativeSurfaceEvents(program, snapshot, admission = {}) {
  const materialization = materializeNativeSurfaceScopes(program, snapshot);
  assertNativeCanonicalData(admission);
  if (Object.values(admission).some(value => typeof value !== 'boolean')) invalid('Native event admission must contain Boolean values.');
  const entries = program.render.nativeView.eventKeys || [], definitions = new Map((program.events || []).map(event => [event.id, event]));
  const eventKeys = new Map();
  for (const entry of entries) {
    fields(entry, ['event', 'surface', 'astPointer', 'fields'], 'Native event key scope');
    name(entry.event); name(entry.surface);
    if (!definitions.has(entry.event) || eventKeys.has(entry.event) || definitions.get(entry.event).surface !== entry.surface || !entry.fields || typeof entry.fields !== 'object' || Array.isArray(entry.fields)) invalid('Native event keys must name one matching declared Surface event.');
    const scope = validateNativeSurfaceScopes(program).declarations.find(row => row.surface === entry.surface);
    for (const [field, index] of Object.entries(entry.fields)) {
      name(field);
      if (!Number.isSafeInteger(index) || Object.is(index, -0) || index < 0 || index >= (scope?.repeat?.length || 0)
          || definitions.get(entry.event).payload?.[field] !== '$detail.__rmtxScopedKeys.k' + index) invalid('Native event keys require the exact compiler-owned key payload mapping.');
    }
    eventKeys.set(entry.event, entry);
  }
  const events = [], scopes = [], ids = new Set();
  for (const definition of program.events || []) {
    const rows = definition.surface == null ? [null] : materialization.instances.filter(row => row.surfaceId === definition.surface);
    for (const instance of rows) {
      if (instance && Object.hasOwn(admission, instance.id) && !admission[instance.id]) continue;
      const event = clone(definition);
      if (instance) {
        event.id = definition.id + ':rmtx:' + JSON.stringify(instance.keys);
        event.surface = instance.id; event.owner = instance.id;
        event.target = concreteSurfaceSelector(instance.id); event.closest = null;
      }
      if (ids.has(event.id)) invalid('Concrete native event identities must be unique.'); ids.add(event.id);
      events.push(event);
      scopes.push({ eventId: event.id, ...(instance ? { surfaceId: instance.id, keys: instance.keys.slice() } : { keys: [] }), trustedKeys: eventKeys.has(definition.id) });
    }
  }
  return freeze({ events, scopes });
}
function scopeNativeEvent(event, keys) {
  assertNativeCanonicalData(keys); segments(keys);
  const read = field => {
    if (!event || typeof event !== 'object') return undefined;
    const prototype = Object.getPrototypeOf(event);
    if ([Object.prototype, null].includes(prototype)) {
      const descriptor = Object.getOwnPropertyDescriptor(event, field);
      if (descriptor && !Object.hasOwn(descriptor, 'value')) invalid('Native event summary fields cannot be accessors.');
      return descriptor?.value;
    }
    return Reflect.get(event, field, event);
  };
  const raw = read('detail');
  const detail = raw && typeof raw === 'object' ? Array.isArray(raw) ? [] : Object.create(Object.getPrototypeOf(raw)) : Object.create(null);
  if (raw && typeof raw === 'object') {
    const descriptors = Object.getOwnPropertyDescriptors(raw);
    delete descriptors.__rmtxScopedKeys;
    Object.defineProperties(detail, descriptors);
  }
  const trusted = Object.freeze(Object.fromEntries(keys.map((key, index) => ['k' + index, key])));
  Object.defineProperty(detail, '__rmtxScopedKeys', { enumerable: true, value: trusted });
  Object.freeze(detail);
  const summary = Object.create(null);
  for (const field of ['type', 'target', 'currentTarget', 'timeStamp']) summary[field] = read(field);
  summary.detail = detail;
  for (const field of ['preventDefault', 'stopPropagation', 'stopImmediatePropagation', 'composedPath']) {
    const method = read(field);
    if (typeof method === 'function') summary[field] = method.bind(event);
  }
  Object.freeze(summary);
  return new Proxy(summary, { get(target, field) {
    if (Object.hasOwn(target, field)) return target[field];
    const value = read(field);
    return typeof value === 'function' ? value.bind(event) : value;
  } });
}

module.exports = { NATIVE_SURFACE_SCOPES_API_VERSION, NATIVE_SURFACE_SCOPES_SCHEMA, NATIVE_SURFACE_MATERIALIZATION_SCHEMA,
  MAX_NATIVE_SURFACE_ID_LENGTH, MAX_NATIVE_SURFACE_INSTANCES, validateNativeSurfaceScopes, nativeSurfaceScopeKey, nativeSurfaceInstanceId,
  resolveNativeSurfaceInstance, findNativeSurfaceInstance, scopeNativeProjection, evaluateNativeSurfaceProjection, materializeNativeSurfaceScopes,
  concreteSurfaceSelector, materializeNativeSurfaceEvents, scopeNativeEvent, validateNativeSurfaceMaterialization };
