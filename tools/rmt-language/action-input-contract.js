'use strict';

const { data, fields, name } = require('../xtensions/state-binding-contract');
const RMT_ACTION_INPUT_CONTRACT_SCHEMA = 'xtend.rmt.action-input-contract.v1';
const RMTX_ACTION_INPUT_RULES_SCHEMA = 'xtend.rmtx.action-input-rules.v1';
const RMT_ACTION_PLAN_SCHEMA_V2 = 'xtend.rmt.action-plan.v2';
const RMT_NATIVE_EVENT_BINDING_SCHEMA_V2 = 'xtend.rmt.native-event-binding.v2';
function reject(message, actionId, inputName) {
  throw Object.assign(new TypeError(message), { code: 'rmt.action.input.contract.invalid', actionId, inputName });
}
function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
  return value;
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function valueRule(type, actionId, inputName, depth = 0) {
  if (typeof type !== 'string' || depth > 16) reject('Action input type exceeds the closed JSON type profile.', actionId, inputName);
  if (type.endsWith('[]')) return { type: 'array', nullable: false, items: valueRule(type.slice(0, -2), actionId, inputName, depth + 1) };
  if (type === 'collection') type = 'array';
  if (!['string', 'number', 'boolean', 'object', 'array', 'json', 'null'].includes(type))
    reject(`Action input type ${type} requires an explicit supported JSON contract.`, actionId, inputName);
  return { type, nullable: ['json', 'null'].includes(type), ...(type === 'array' ? { items: { type: 'json', nullable: true } } : {}) };
}
function matches(value, rule) {
  if (value === null) return rule.nullable;
  if (rule.type === 'null') return false;
  if (rule.type === 'json') return true;
  if (rule.type === 'array') return Array.isArray(value) && value.every(item => matches(item, rule.items));
  if (rule.type === 'object') return typeof value === 'object' && !Array.isArray(value);
  return typeof value === rule.type;
}

/** A compiler-owned JSON policy, not authority or inferred application types. */
function createRmtActionInputContract(core, sourceRules) {
  const actions = Array.isArray(core?.actions) ? core.actions : [];
  const ids = new Set();
  for (const action of actions) {
    const id = action.name || action.id;
    if (typeof id !== 'string' || !/^[A-Za-z_$][\w$-]*(?:\.[A-Za-z_$][\w$-]*)*$/u.test(id)
      || id.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part)) || ids.has(id)) reject('Action identities must be unique safe symbols.', id);
    ids.add(id);
  }
  const source = new Map();
  if (sourceRules !== undefined) {
    try { data(sourceRules); fields(sourceRules, ['schema', 'sourceProfile', 'actions'], 'Action input source rules'); }
    catch (error) { reject(error.message); }
    if (sourceRules.schema !== RMTX_ACTION_INPUT_RULES_SCHEMA || sourceRules.sourceProfile?.syntax !== 'rmtx'
        || sourceRules.sourceProfile.version !== '4.0.0' || !Array.isArray(sourceRules.actions)) reject('Expected complete RMTX4 action input source rules.');
    try { fields(sourceRules.sourceProfile, ['syntax', 'version'], 'Source profile'); } catch (error) { reject(error.message); }
    for (const action of sourceRules.actions) {
      try { fields(action, ['id', 'inputs'], 'Action input declaration'); name(action.id); }
      catch (error) { reject(error.message, action?.id); }
      if (source.has(action.id) || !Array.isArray(action.inputs)) reject('Action input source declarations must be unique.', action.id);
      source.set(action.id, action);
    }
    if (source.size !== actions.length || actions.some(action => !source.has(action.name || action.id))) reject('Source input rules must cover exactly the declared Actions.');
  }
  const contract = { schema: RMT_ACTION_INPUT_CONTRACT_SCHEMA, apiVersion: '1.0.0', sourceProfile: { syntax: 'rmtx', version: '4.0.0' },
    actions: actions.map(action => {
      const id = action.name || action.id, inputs = action.inputs || [], declared = source.get(id);
      const rules = new Map();
      for (const input of declared?.inputs || []) {
        try { fields(input, ['name', 'type', 'optional', 'nullable', 'default'], 'Action input source rule'); name(input.name); }
        catch (error) { reject(error.message, id, input?.name); }
        if (rules.has(input.name)) reject('Duplicate Action input source rule.', id, input.name);
        rules.set(input.name, input);
      }
      if (declared && (rules.size !== inputs.length || inputs.some(input => !rules.has(input.name)))) reject('Source rules must cover exactly the declared Action inputs.', id);
      const fieldRules = {};
      for (const input of inputs) {
        if (!/^[A-Za-z_$][\w$-]*$/u.test(input.name) || ['__proto__', 'prototype', 'constructor'].includes(input.name))
          reject('Action input fields require simple safe field names.', id, input.name);
        if (Object.hasOwn(fieldRules, input.name)) reject('Duplicate Action input.', id, input.name);
        const declaredRule = rules.get(input.name) || {};
        if (declared && declaredRule.type !== input.type) reject('Source rule type differs from the declared Action input.', id, input.name);
        for (const key of ['optional', 'nullable']) if (Object.hasOwn(declaredRule, key) && typeof declaredRule[key] !== 'boolean')
          reject(`${key} requires a Boolean.`, id, input.name);
        const rule = valueRule(input.type, id, input.name), hasDefault = Object.hasOwn(declaredRule, 'default');
        if (Object.hasOwn(declaredRule, 'nullable')) rule.nullable = declaredRule.nullable;
        if (rule.type === 'null' && !rule.nullable) reject('The null input type cannot prohibit null.', id, input.name);
        rule.required = declaredRule.optional !== true && !hasDefault;
        if (hasDefault) {
          if (!matches(declaredRule.default, rule)) reject('Action input default does not match its declared type.', id, input.name);
          rule.default = clone(declaredRule.default);
        }
        fieldRules[input.name] = rule;
      }
      return { id, fields: fieldRules };
    }) };
  return freeze(contract);
}

module.exports = { RMT_ACTION_INPUT_CONTRACT_SCHEMA, RMTX_ACTION_INPUT_RULES_SCHEMA,
  RMT_ACTION_PLAN_SCHEMA_V2, RMT_NATIVE_EVENT_BINDING_SCHEMA_V2, createRmtActionInputContract };
