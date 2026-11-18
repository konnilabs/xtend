// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data } = require('./state-binding-contract');
const objectSource = Function.prototype.toString.call(Object), arraySource = Function.prototype.toString.call(Array);

function nativePrototype(prototype, source, object = false) {
  if (!prototype || object && Object.getPrototypeOf(prototype) !== null) return false;
  const constructor = Object.getOwnPropertyDescriptor(prototype, 'constructor');
  return !!constructor && Object.hasOwn(constructor, 'value') && typeof constructor.value === 'function'
    && Function.prototype.toString.call(constructor.value) === source
    && Object.getOwnPropertyDescriptor(constructor.value, 'prototype')?.value === prototype;
}

// Official build factories may use a separate VM realm. Preserve descriptors
// while adapting only genuine native Object/Array containers for data().
function localData(value, seen = new Set()) {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) throw new TypeError('Binding data must be finite, acyclic JSON.');
  const array = Array.isArray(value), prototype = Object.getPrototypeOf(value);
  if (prototype !== null && !(array ? prototype === Array.prototype || nativePrototype(prototype, arraySource)
    : prototype === Object.prototype || nativePrototype(prototype, objectSource, true))) throw new TypeError('Binding data must use plain objects and native arrays.');
  for (let parent = prototype; parent; parent = Object.getPrototypeOf(parent)) {
    if (Object.getOwnPropertyDescriptor(parent, 'toJSON')) throw new TypeError('Native data must not inherit JSON serialization hooks.');
  }
  seen.add(value);
  const result = array ? [] : Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (Object.hasOwn(descriptor, 'value')) descriptor.value = localData(descriptor.value, seen);
    Object.defineProperty(result, key, descriptor);
  }
  seen.delete(value); return result;
}

/** JSON cloning erases -0. Inspect descriptors before reading any values. */
function assertNativeCanonicalData(value, allowUndefined = false) {
  try {
    const checked = localData(value);
    data(checked, new Set(), allowUndefined);
    const visit = current => {
      if (Object.is(current, -0)) throw new TypeError('Native data requires canonical zero; negative zero is not permitted.');
      if (current && typeof current === 'object') Object.values(current).forEach(visit);
    };
    visit(checked);
  } catch (error) { error.code = 'rmt.native-view.invalid'; throw error; }
}
module.exports = { assertNativeCanonicalData };
