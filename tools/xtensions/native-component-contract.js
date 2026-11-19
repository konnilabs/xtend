// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data, fields, clone, freeze } = require('./state-binding-contract');
const { NATIVE_COMPONENT_CATALOG } = require('./native-component-catalog');
const NATIVE_COMPONENT_METADATA_SCHEMA = 'xtend.rmt.native-component-metadata.v1';
const unsafe = new Set(['constructor', 'prototype', '__proto__', 'style', 'slot', 'part', 'innerhtml', 'outerhtml', 'textcontent', 'children', 'srcdoc', 'srcset']);
function allowedNativeComponentSink(value, kind) {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/u.test(value) || /^on/iu.test(value) || unsafe.has(value.toLowerCase())
      || /^(?:data-rmt-|data-rmtx-|data-maraca-|data-xt-|data-xtend-)/u.test(value)) return false;
  return kind !== 'attribute' || value === value.toLowerCase();
}
function nativeComponentSinkAllowed(metadata, name, kind) {
  if (!allowedNativeComponentSink(name, kind)) return false;
  // Source7 has no implicit native/global/data/ARIA property fallthrough.
  // The captured reviewed subset is the complete per-tag capability list.
  return kind === 'attribute' ? metadata.attributes.includes(name)
    : kind === 'property' && metadata.properties.includes(name);
}
function validateNativeComponentMetadata(input) {
  data(input); fields(input, ['tag', 'module', 'sha256', 'ownership', 'attributes', 'properties', 'slots'], 'Public native component metadata');
  if (typeof input.tag !== 'string' || !/^x-[a-z][a-z0-9-]*$/u.test(input.tag) || input.module !== `components/${input.module?.split('/').at(-1)}`
      || !/^components\/[a-zA-Z0-9_-]+\.js$/u.test(input.module) || !/^[a-f0-9]{64}$/u.test(input.sha256) || input.ownership !== 'shadow')
    throw new TypeError('Native components require captured shipped Shadow DOM component metadata.');
  for (const kind of ['attributes', 'properties', 'slots']) {
    const values = input[kind];
    if (!Array.isArray(values) || values.length > 256 || new Set(values).size !== values.length || values.some(value => kind === 'slots'
      ? typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/u.test(value) || unsafe.has(value.toLowerCase())
      : !allowedNativeComponentSink(value, kind === 'attributes' ? 'attribute' : 'property')))
      throw new TypeError('Public component metadata requires bounded, safe, distinct declared fields and slots.');
  }
  return freeze(clone(input));
}
/** Captured runtime grants must equal the reviewed shipped subset, not merely
 * claim a structurally valid tag/hash/property record in a Header2 payload. */
function validateCapturedNativeComponentMetadata(input) {
  const value = validateNativeComponentMetadata(input);
  const expected = NATIVE_COMPONENT_CATALOG.find(row => row.tag === value.tag);
  if (!expected || ['tag', 'module', 'sha256', 'ownership'].some(name => value[name] !== expected[name])
      || ['attributes', 'properties', 'slots'].some(name => JSON.stringify([...value[name]].sort()) !== JSON.stringify(expected[name])))
    throw new TypeError('Native component metadata must exactly match the reviewed captured runtime catalog.');
  return value;
}
module.exports = { NATIVE_COMPONENT_METADATA_SCHEMA, allowedNativeComponentSink, nativeComponentSinkAllowed, validateNativeComponentMetadata, validateCapturedNativeComponentMetadata };
