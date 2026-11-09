// SPDX-License-Identifier: Apache-2.0
'use strict';

const XTENSION_STATE_BINDING_SCHEMA = 'xtend.xtensions.state-binding.v2';
const LEGACY_BINDING_SCHEMA = 'xtend.xtensions.state-binding.v1';
const unsafe = new Set(['__proto__', 'prototype', 'constructor']);
const reservedProps = new Set(['xtension', 'key', 'ref', 'dangerouslySetInnerHTML', 'innerHTML', 'outerHTML', 'srcdoc']);
const clone = (value) => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function data(value, seen = new Set(), allowUndefined = false) {
  // The existing in-memory compiler artifact has optional undefined fields.
  // Binding declarations themselves always use the strict default.
  if (allowUndefined && value === undefined) return;
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return;
  if (!value || typeof value !== 'object' || seen.has(value)) throw new TypeError('Binding data must be finite, acyclic JSON.');
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError('Binding data must use plain objects.');
  seen.add(value);
  const keys = Reflect.ownKeys(value);
  if (Array.isArray(value) && keys.length !== value.length + 1) throw new TypeError('Binding arrays must be dense JSON arrays.');
  for (const key of keys) {
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || unsafe.has(key) || !descriptor.enumerable || !('value' in descriptor) ||
      Array.isArray(value) && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)) throw new TypeError('Binding data contains an unsafe key or accessor.');
    data(descriptor.value, seen, allowUndefined);
  }
  seen.delete(value);
}
function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
}
function fields(value, allowed, label) {
  record(value, label);
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw new TypeError(`${label} contains an unsupported field.`);
}
function name(value) {
  if (typeof value !== 'string' || !value || value.trim() !== value || unsafe.has(value)) throw new TypeError('Binding names must be nonempty, unpadded safe strings.');
}
function segments(value) {
  if (!Array.isArray(value)) throw new TypeError('Binding paths must be segment arrays.');
  for (const part of value) {
    if (typeof part === 'string') name(part);
    else if (!Number.isSafeInteger(part) || part < 0 || Object.is(part, -0)) throw new TypeError('Numeric path segments must be nonnegative safe integers.');
  }
}
function bindingPath(value, keyed) {
  if (!Array.isArray(value)) throw new TypeError('Binding paths must be segment arrays.');
  for (const part of value) {
    if (!keyed || !part || typeof part !== 'object') { segments([part]); continue; }
    fields(part, ['key'], 'Key selector'); fields(part.key, ['path', 'value'], 'Key selector');
    segments(part.key.path); if (!part.key.path.length) throw new TypeError('Key selectors need a nonempty item path.');
    segments([part.key.value]);
  }
}
function readBindingPath(value, path) {
  for (const part of path) {
    if (part && typeof part === 'object') {
      if (!Array.isArray(value)) throw new TypeError('A keyed path requires a Model array.');
      const seen = new Set(); let match, found = false;
      for (const item of value) {
        const key = readBindingPath(item, part.key.path); segments([key]);
        const token = JSON.stringify(key);
        if (seen.has(token)) throw new TypeError('Model item keys must be unique within their collection.');
        seen.add(token);
        if (key === part.key.value) { match = item; found = true; }
      }
      if (!found) throw new TypeError('The keyed Model item does not exist.');
      value = match;
    } else {
      if (!value || typeof value !== 'object' || !Object.hasOwn(value, part)) throw new TypeError('The Model path does not exist.');
      value = value[part];
    }
  }
  return value;
}
function rule(value, extra = []) {
  fields(value, ['type', 'nullable', 'fields', 'items', ...extra], 'Value rule');
  if (!['string', 'number', 'boolean', 'object', 'array', 'json'].includes(value.type) || value.nullable !== undefined && typeof value.nullable !== 'boolean') throw new TypeError('Unsupported binding value rule.');
  if (value.type === 'object') {
    record(value.fields, 'Object fields');
    for (const [key, field] of Object.entries(value.fields)) { name(key); rule(field); }
  } else if (value.fields !== undefined) throw new TypeError('Only object rules accept fields.');
  if (value.type === 'array') rule(value.items);
  else if (value.items !== undefined) throw new TypeError('Only array rules accept items.');
}
function typed(value, spec, label) {
  data(value);
  if (value === null) { if (!spec.nullable) throw new TypeError(`${label} is not nullable.`); return; }
  if (spec.type === 'object') {
    record(value, label);
    const keys = Object.keys(spec.fields);
    if (Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) throw new TypeError(`${label} fields must match the declaration exactly.`);
    for (const key of keys) typed(value[key], spec.fields[key], `${label}.${key}`);
  } else if (spec.type === 'array') {
    if (!Array.isArray(value)) throw new TypeError(`${label} must be an array.`);
    value.forEach((item, index) => typed(item, spec.items, `${label}[${index}]`));
  } else if (spec.type !== 'json' && typeof value !== spec.type) throw new TypeError(`${label} does not match its declared type.`);
}
function addressKey(address) {
  fields(address, ['documentId', 'declarationId', 'keys'], 'Instance address');
  name(address.documentId); name(address.declarationId); segments(address.keys);
  // Tuple encoding preserves both segment boundaries and string/number identity.
  return JSON.stringify([address.documentId, address.declarationId, address.keys]);
}
function validateStateBinding(input) {
  data(input);
  fields(input, ['schema', 'address', 'props', 'intents'], 'State binding');
  if (![XTENSION_STATE_BINDING_SCHEMA, LEGACY_BINDING_SCHEMA].includes(input.schema)) throw new TypeError('Unsupported state binding schema.');
  addressKey(input.address);
  record(input.props, 'Props'); record(input.intents, 'Intents');
  for (const [prop, spec] of Object.entries(input.props)) {
    name(prop); if (reservedProps.has(prop)) throw new TypeError('A controlled prop cannot grant runtime authority.');
    rule(spec, ['state', 'path']); name(spec.state); bindingPath(spec.path, input.schema === XTENSION_STATE_BINDING_SCHEMA);
  }
  for (const [event, spec] of Object.entries(input.intents)) {
    name(event); fields(spec, ['command', 'payloadSchema', 'fields', ...(input.schema === XTENSION_STATE_BINDING_SCHEMA ? ['keyFields'] : [])], 'Intent');
    name(spec.command); name(spec.payloadSchema); record(spec.fields, 'Intent fields');
    for (const [key, field] of Object.entries(spec.fields)) { name(key); rule(field); }
    if (Object.hasOwn(spec, 'keyFields')) {
      record(spec.keyFields, 'Intent key fields');
      for (const [key, field] of Object.entries(spec.keyFields)) {
        name(key); fields(field, ['index', 'type'], 'Intent key field');
        if (Object.hasOwn(spec.fields, key) || !Number.isSafeInteger(field.index) || field.index < 0 || Object.is(field.index, -0) || field.index >= input.address.keys.length ||
          !['string', 'number', 'json'].includes(field.type)) throw new TypeError('Intent key fields require distinct names, valid address indices and primitive key types.');
        typed(input.address.keys[field.index], field, `Intent key ${key}`);
      }
    }
  }
  return freeze(clone(input));
}
function propsFrom(snapshot, definition) {
  const props = {};
  for (const [prop, spec] of Object.entries(definition.props)) {
    const value = readBindingPath(snapshot.states, [spec.state, ...spec.path]);
    typed(value, spec, `Controlled prop ${prop}`);
    props[prop] = value;
  }
  return freeze(clone(props));
}

module.exports = { XTENSION_STATE_BINDING_SCHEMA, validateStateBinding, addressKey, propsFrom, clone, freeze, data, record, fields, name, typed, segments, bindingPath, readBindingPath };
