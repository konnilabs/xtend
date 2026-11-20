// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data, fields, clone, freeze } = require('./state-binding-contract');
const {NATIVE_COMPONENT_CATALOG_V2}=require('./native-component-catalog-v2');
const NATIVE_COMPONENT_METADATA_SCHEMA_V2 = 'xtend.rmt.native-component-metadata.v2';
const forbidden = new Set(['constructor', 'prototype', '__proto__', 'style', 'slot', 'part', 'innerhtml', 'outerhtml', 'textcontent', 'children', 'srcdoc', 'srcset']);
const controllerState=new Set(['open','active','minimized','maximized','collapsed','pinned','modal','label','mode','placement','x','y','width','height','bounds','initial-x','initial-y','initial-width','initial-height','initial-min-width','initial-min-height','initial-max-width','initial-max-height','bounds-mode','bounds-scope','layout','layout-engine','modal-policy','surface-layout-gap','surface-layout-snap']);
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const localModule = value => typeof value === 'string' && /^(?:components|tools|xtendrmt|fabric)\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:js|mjs|cjs|json)$/.test(value) && !value.split('/').includes('..');
function safeName(value, attribute = false) {
  return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_:-]*$/.test(value) && (!attribute || value === value.toLowerCase())
    && !/^on/i.test(value) && !forbidden.has(value.toLowerCase()) && !/^(?:data-rmt-|data-rmtx-|data-maraca-|data-xt-|data-xtend-)/.test(value);
}
function names(values, label) {
  if (!Array.isArray(values) || values.length > 256 || new Set(values).size !== values.length || values.some(value => typeof value !== 'string' || !value || ['__proto__', 'constructor', 'prototype'].includes(value))) throw new TypeError(label + ' requires distinct safe names.');
}
function valueRule(rule, depth = 0) {
  if (depth > 16) throw new TypeError('Native value rules exceed the supported depth.');
  fields(rule, ['type', 'nullable', 'fields', 'items', 'optional', 'enum', 'minimum', 'maximum', 'maxLength','format'], 'Native value rule');
  if (!['string', 'boolean', 'number', 'key', 'object', 'array', 'json'].includes(rule.type) || rule.nullable !== undefined && typeof rule.nullable !== 'boolean') throw new TypeError('Invalid native value rule.');
  if (rule.type === 'object') {
    fields(rule.fields, Object.keys(rule.fields || {}), 'Native object fields'); names(Object.keys(rule.fields), 'Native object fields');
    Object.values(rule.fields).forEach(child => valueRule(child, depth + 1));
    if (rule.optional !== undefined) { names(rule.optional, 'Native optional fields'); if (rule.optional.some(key => !Object.hasOwn(rule.fields, key))) throw new TypeError('Optional fields must be declared.'); }
  } else if (rule.fields !== undefined || rule.optional !== undefined) throw new TypeError('Only object rules declare fields.');
  if (rule.type === 'array') valueRule(rule.items, depth + 1);
  else if (rule.items !== undefined) throw new TypeError('Only array rules declare items.');
  if (rule.enum !== undefined && (!Array.isArray(rule.enum) || !rule.enum.length || rule.enum.some(value => value === null ? !rule.nullable : typeof value !== rule.type || !['string', 'number', 'boolean'].includes(rule.type)))) throw new TypeError('Native enums contain scalar values of their declared type.');
  for (const key of ['minimum', 'maximum']) if (rule[key] !== undefined && (rule.type !== 'number' || !Number.isFinite(rule[key]))) throw new TypeError('Native number bounds require finite numbers.');
  if (rule.minimum !== undefined && rule.maximum !== undefined && rule.minimum > rule.maximum) throw new TypeError('Native number bounds are inverted.');
  if (rule.maxLength !== undefined && (!['array', 'string'].includes(rule.type) || !Number.isSafeInteger(rule.maxLength) || rule.maxLength < 0)) throw new TypeError('Native lengths require a nonnegative integer.');
  if(rule.format!==undefined&&(rule.type!=='string'||!['civil-date','civil-date-or-empty'].includes(rule.format)))throw new TypeError('Native formats must use a closed supported string format.');
  return rule;
}
function validateNativeValueV2(value, rule, label = 'Native value') {
  data(value); valueRule(rule);
  if (value === null) { if (!rule.nullable) throw new TypeError(label + ' is not nullable.'); return true; }
  if (rule.type === 'object') {
    fields(value, Object.keys(rule.fields), label);
    for (const [key, child] of Object.entries(rule.fields)) {
      if (!Object.hasOwn(value, key)) { if (!(rule.optional || []).includes(key)) throw new TypeError(label + '.' + key + ' is required.'); }
      else validateNativeValueV2(value[key], child, label + '.' + key);
    }
  } else if (rule.type === 'array') {
    if (!Array.isArray(value)) throw new TypeError(label + ' requires an array.');
    value.forEach((item, index) => validateNativeValueV2(item, rule.items, label + '[' + index + ']'));
  } else if(rule.type==='key') { requireKey(value,label); }
  else if (rule.type !== 'json' && typeof value !== rule.type) throw new TypeError(label + ' has an incompatible type.');
  if (rule.enum && !rule.enum.includes(value) || rule.minimum !== undefined && value < rule.minimum || rule.maximum !== undefined && value > rule.maximum || rule.maxLength !== undefined && value.length > rule.maxLength) throw new TypeError(label + ' violates its declared bounds.');
  if(rule.format&&!(rule.format==='civil-date-or-empty'&&value==='')){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new TypeError(label+' requires a civil YYYY-MM-DD date.');const [year,month,day]=value.split('-').map(Number),date=new Date(0);date.setUTCFullYear(year,month-1,day);if(year<1||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw new TypeError(label+' requires a real civil calendar date.');}
  return true;
}
function requireKey(value,label){if(typeof value==='string'){if(!value||value.trim()!==value||['constructor','prototype','__proto__'].includes(value))throw new TypeError(label+' requires a stable typed key.');}else if(!Number.isSafeInteger(value)||value<0||Object.is(value,-0))throw new TypeError(label+' requires a stable typed key.');}
function validateNativeComponentMetadataV2(input) {
  data(input); fields(input, ['schema', 'tag', 'module', 'managedModule', 'sha256', 'dependencies', 'role', 'ownership', 'sourceStrategy', 'attributes', 'properties', 'events', 'commands', 'state', 'slots', 'dom', 'capabilities', 'status'], 'Native component metadata2');
  if (input.schema !== NATIVE_COMPONENT_METADATA_SCHEMA_V2 || !/^(?:x-[a-z][a-z0-9-]*|xtend-(?:i18n|state))$/.test(input.tag || '') || !localModule(input.module) || !input.module.startsWith('components/') || !localModule(input.managedModule) || !digest(input.sha256) || !['ui', 'platform', 'service', 'demo'].includes(input.role) || !['shadow', 'surface', 'service'].includes(input.ownership) || input.sourceStrategy !== 'managed-shared-definition') throw new TypeError('A captured native component2 role and local definition are required.');
  if (!Array.isArray(input.dependencies) || input.dependencies.length > 512) throw new TypeError('Native component dependency captures must be bounded.');
  const modules = new Set();
  for (const dependency of input.dependencies) { fields(dependency, ['module', 'sha256'], 'Native source dependency'); if (!localModule(dependency.module) || !digest(dependency.sha256) || modules.has(dependency.module) || dependency.module === input.module) throw new TypeError('Native dependencies require unique pinned local modules.'); modules.add(dependency.module); }
  if (input.managedModule !== input.module && !modules.has(input.managedModule)) throw new TypeError('The managed definition must be pinned in the dependency capture.');
  for (const kind of ['attributes', 'properties']) {
    fields(input[kind], Object.keys(input[kind] || {}), 'Native ' + kind);
    if (Object.keys(input[kind]).length > 256) throw new TypeError('Native sinks must be bounded.');
    for (const [key, rule] of Object.entries(input[kind])) { if (!safeName(key, kind === 'attributes')) throw new TypeError('Unsafe native sink.'); valueRule(rule); if (kind === 'attributes' && !['string', 'number', 'boolean'].includes(rule.type)) throw new TypeError('Native attributes must stay scalar.'); }
  }
  fields(input.events, Object.keys(input.events || {}), 'Native events');
  for (const [event, spec] of Object.entries(input.events)) { if (!/^[a-z][a-z0-9:-]*$/.test(event)) throw new TypeError('Unsafe native event.'); fields(spec, ['payload'], 'Native event contract'); valueRule(spec.payload); }
  fields(input.commands, Object.keys(input.commands || {}), 'Native commands');
  names(input.capabilities, 'Native capabilities');
  for (const [command, spec] of Object.entries(input.commands)) { if (!safeName(command)) throw new TypeError('Unsafe native command.'); fields(spec, ['args', 'result', 'capability'], 'Native command contract'); valueRule(spec.args); valueRule(spec.result); if (typeof spec.capability !== 'string' || !input.capabilities.includes(spec.capability)) throw new TypeError('Native commands require an explicit capability.'); }
  names(input.slots, 'Native slots'); fields(input.state, ['controlled', 'ephemeral'], 'Native state domains'); names(input.state.controlled, 'Controlled native state'); names(input.state.ephemeral, 'Ephemeral native state');
  if (input.state.controlled.some(key => !Object.hasOwn(input.properties, key) && !Object.hasOwn(input.attributes, key))) throw new TypeError('Controlled state must name a declared sink.');
  fields(input.dom, ['authorChildren', 'writes'], 'Native DOM domains'); if (input.dom.authorChildren !== 'preserve' || !['shadow-only', 'surface-port', 'none'].includes(input.dom.writes)) throw new TypeError('Native author children remain renderer owned.');
  fields(input.status, ['implementation', 'verification'], 'Native feature status'); if (!['implemented', 'pending'].includes(input.status.implementation) || !['pending', 'verified'].includes(input.status.verification)) throw new TypeError('Native status requires explicit implementation and evidence.');
  return freeze(clone(input));
}
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
function validateCapturedNativeComponentMetadataV2(input) {
  const result = validateNativeComponentMetadataV2(input), expected = NATIVE_COMPONENT_CATALOG_V2.find(row => row.tag === result.tag);
  if (!expected || canonical(expected) !== canonical(result)) throw new TypeError('Native metadata2 differs from the reviewed captured catalog.');
  return result;
}
function nativeComponentSinkAllowedV2(meta, name, kind) { return safeName(name, kind === 'attribute') && (kind === 'attribute' || kind === 'property') && Object.hasOwn(kind === 'attribute' ? meta.attributes : meta.properties, name); }
function validateNativeComponentValuesV2(meta, input) {
  data(input); fields(input, ['attributes', 'properties'], 'Native component update');
  for (const [kind, values] of Object.entries(input)) {
    fields(values, Object.keys(values || {}), 'Native ' + kind);
    for (const [name, value] of Object.entries(values)) { if (!nativeComponentSinkAllowedV2(meta, name, kind === 'attributes' ? 'attribute' : 'property')) {if(meta.role==='platform'&&controllerState.has(name))throw new TypeError('Controller-owned native platform state requires a declared component command: '+name);throw new TypeError('Undeclared native component sink: ' + name);} validateNativeValueV2(value, meta[kind][name], 'Native ' + kind + '.' + name); }
  }
  return freeze(clone(input));
}
function validateNativeComponentEventV2(meta, event, payload) { const spec = Object.hasOwn(meta.events, event) && meta.events[event]; if (!spec) throw new TypeError('Undeclared native event.'); validateNativeValueV2(payload, spec.payload, 'Native event ' + event); return freeze(clone(payload)); }
function validateNativeComponentCommandV2(meta, command, args) { const spec = Object.hasOwn(meta.commands, command) && meta.commands[command]; if (!spec) throw new TypeError('Undeclared native command.'); validateNativeValueV2(args, spec.args, 'Native command ' + command); return freeze(clone(args)); }
module.exports = { NATIVE_COMPONENT_METADATA_SCHEMA_V2, validateNativeComponentMetadataV2, validateCapturedNativeComponentMetadataV2, nativeComponentSinkAllowedV2, validateNativeComponentValuesV2, validateNativeComponentEventV2, validateNativeComponentCommandV2, validateNativeValueV2, canonical };
