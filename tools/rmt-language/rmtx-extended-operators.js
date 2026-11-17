'use strict';

const { RMTX_EXTENDED_OPERATOR_RULES } = require('./rmtx-operator-coverage');
const own = (object, key) => Object.hasOwn(object, key);
const identifierText = value => value.split('.').map(part => part.includes('$') ? '`' + part + '`' : part).join('.');

// All legacy text fields below are GENERATED from closed attributes and value
// trees. No source string is parsed as an operation, expression or AST fragment.
function serializeClosedPrimitive(value) {
  if (value.kind === 'literal') return JSON.stringify(value.value);
  if (value.kind === 'path') return identifierText(value.value);
  if (value.kind === 'array') return '[' + value.items.map(serializeClosedPrimitive).join(', ') + ']';
  if (value.kind === 'object') return '{ ' + value.fields.map(field => JSON.stringify(field.key) + ' ' + serializeClosedPrimitive(field.value)).join(' ') + ' }';
  throw new TypeError('Unsupported declarative primitive value.');
}

function lowerExtendedOperator(op, context) {
  const rule = RMTX_EXTENDED_OPERATOR_RULES[op];
  if (!rule) return undefined;
  const { ts, node, fields, make, fail, value, text, identifier, expressionField, primitiveExpression, lowerChildren, leaf } = context;
  const serializePrimitive = context.serializePrimitive || serializeClosedPrimitive;
  const bad = (message, key) => fail('rmtx.operator.attribute', message, fields[key] || node);
  const stringValue = (key, required = false, symbol = false) => text(fields, key, required, symbol);
  const primitive = (key, required = false) => {
    if (!fields[key]) { if (required) bad(`Missing required attribute ${key}.`, key); return null; }
    const field = fields[key];
    if (field.initializer && ts.isJsxExpression(field.initializer) && field.initializer.expression)
      return primitiveExpression(field.initializer.expression);
    return value(fields, key, required);
  };
  const read = key => {
    const spec = rule.attributes[key];
    if (!fields[key]) { if (spec.required) bad(`Missing required attribute ${key}.`, key); return undefined; }
    if (spec.kind === 'symbol' || spec.kind === 'string' || spec.kind === 'enum') {
      const result = stringValue(key, true, spec.kind === 'symbol');
      if (spec.values && !spec.values.includes(result)) bad(`${key} must be one of ${spec.values.join(', ')}.`, key);
      return result;
    }
    if (spec.kind === 'primitive-expression') return primitive(key, true);
    const result = value(fields, key, true);
    if (spec.kind === 'number' && (result.kind !== 'literal' || typeof result.value !== 'number')) bad(`${key} requires a finite static number.`, key);
    if (spec.kind === 'boolean' && (result.kind !== 'literal' || typeof result.value !== 'boolean')) bad(`${key} requires a static boolean.`, key);
    if (spec.kind === 'number-or-string' && (result.kind !== 'literal' || !['number', 'string'].includes(typeof result.value))) bad(`${key} requires a number or CSS string.`, key);
    if (spec.kind === 'string-or-string-array' && !(result.kind === 'literal' && typeof result.value === 'string')
      && !(result.kind === 'array' && result.items.every(item => item.kind === 'literal' && typeof item.value === 'string')))
      bad(`${key} requires a static string or array of strings.`, key);
    return result;
  };
  // Requiredness, enum membership and primitive kind checks happen even for
  // attributes handled by a specialised lowering branch.
  const data = Object.fromEntries(Object.keys(rule.attributes).map(key => [key, read(key)]));
  const at = key => fields[key] || node;
  const makeNode = object => make(rule.astType, node, { ...rule.lowering.constants, ...object });
  const staticPrimitive = key => {
    const item = data[key];
    return item && typeof item === 'object' && item.type === 'RmtPrimitiveValue' ? item
      : make('RmtPrimitiveValue', at(key), { kind: 'literal', value: item });
  };
  const childrenOnce = () => {
    const body = lowerChildren();
    const singleton = new Set(rule.children.filter(child => !['PortalPolicy', 'OverlayPolicy', 'AnimationKeyframe', 'AnimationTimelineStep', 'TransitionTimelineStep', 'SearchWeight', 'SearchValue', 'ValidationTarget', 'ValidationField', 'ValidationInclude', 'ValidationRule', 'RemoteEvent', 'RemoteExpose', 'Slot', 'On', 'Hydration', 'Resumability', 'Isolation'].includes(child)));
    const seen = new Set();
    for (const child of body) {
      if (['RmtHydrationPolicy', 'RmtResumabilityPolicy', 'RmtIsolationPolicy'].includes(child.type)) {
        const active = Object.keys(child).find(key => !['type', 'range', 'astPointer'].includes(key) && child[key] !== null);
        const key = child.type + '.' + active;
        if (seen.has(key)) bad(`Duplicate ${active} policy declaration.`);
        seen.add(key);
      }
      const tag = rule.children.find(name => RMTX_EXTENDED_OPERATOR_RULES[name]?.astType === child.type);
      if (tag && singleton.has(tag)) {
        if (seen.has(tag)) bad(`${op} admits ${tag} at most once.`);
        seen.add(tag);
      }
    }
    return body;
  };
  const fieldsObject = (names, type) => names.filter(key => fields[key]).map(key => make(type, at(key), { key, value: staticPrimitive(key) }));
  const tokenNode = tokens => makeNode({ text: tokens.join(' '), tokens });
  const safeToken = (token, key) => {
    if (typeof token === 'string' && /^[A-Za-z_$][\w$-]*(?:\.[A-Za-z_$][\w$-]*)*$/u.test(token)
      && !token.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) return token;
    if (typeof token === 'number' && Number.isFinite(token) || typeof token === 'boolean' || token === null) return JSON.stringify(token);
    return JSON.stringify(token);
  };
  switch (rule.lowering.mode) {
    case 'nullable-fields': {
      leaf();
      const entries = Object.entries(rule.lowering.fields), present = entries.filter(([attr]) => fields[attr]);
      if (!present.length) bad(`${op} requires at least one explicit policy attribute.`);
      return present.map(([attr, active]) => makeNode(Object.fromEntries(entries.map(([, key]) => [key,
        key === active ? data[attr] && typeof data[attr] === 'object' ? data[attr].value : data[attr] : null]))));
    }
    case 'fields': {
      leaf();
      const object = Object.fromEntries(Object.entries(rule.lowering.fields).filter(([attr]) => data[attr] !== undefined).map(([attr, key]) => [key, data[attr]]));
      return makeNode(object);
    }
    case 'value-clause': leaf(); return makeNode({ value: staticPrimitive('value') });
    case 'body': return makeNode({ body: childrenOnce() });
    case 'slot': return makeNode({ name: data.name, body: lowerChildren() });
    case 'declaration': {
      const body = childrenOnce();
      if (op === 'DataSource') {
        if (!!fields.sourceKind !== !!fields.source) bad('DataSource requires sourceKind and source together.');
        for (const [key, suffix] of [['mode', 'Mode'], ['method', 'Method'], ['contract', 'Contract'], ['result', 'Result']]) {
          if (!fields[key]) continue;
          const type = 'RmtDataSource' + suffix + 'Clause';
          if (body.some(child => child.type === type)) bad(`Duplicate DataSource ${key} declaration.`, key);
          body.push(make(type, at(key), { keyword: key, value: staticPrimitive(key) }));
        }
        if (!!fields.fallbackKind !== !!fields.fallback) bad('DataSource requires fallbackKind and fallback together.');
        if (fields.fallback) {
          if (body.some(child => child.type === 'RmtDataSourceFallbackClause')) bad('Duplicate DataSource fallback.', 'fallback');
          body.push(make('RmtDataSourceFallbackClause', at('fallback'), { kind: data.fallbackKind, value: data.fallback }));
        }
        return makeNode({ name: data.id, source: fields.source ? make('RmtPrimitiveSourceReference', at('source'), { kind: data.sourceKind, value: data.source }) : null, body });
      }
      if (op === 'RemoteSurface') return makeNode({ name: data.id, remoteId: data.remoteId, body });
      if (['Portal', 'Overlay', 'Resource'].includes(op)) return makeNode({ name: data.id, body,
        attributes: Object.keys(rule.attributes).filter(key => key !== 'id' && fields[key]).map(key => make('RmtPrimitiveAttribute', at(key), { keyword: key, value: staticPrimitive(key) })) });
      return makeNode({ name: data.id, body });
    }
    case 'action-effect': {
      leaf();
      if (!!fields.sourceKind !== !!fields.source) bad('Effect requires sourceKind and source together.');
      if (fields.path && data.kind !== 'navigation') bad('Only navigation effects accept a path.', 'path');
      const source = fields.source ? { kind: data.sourceKind, value: data.source } : null;
      return makeNode({ effectKind: data.kind, source, ...(fields.path ? { path: data.path } : {}), componentCommand:
        ['focus', 'reset', 'snapshot'].includes(data.kind) && source?.kind === 'selector' ? { command: data.kind, target: source.value, authoringKind: 'selector' } : null });
    }
    case 'recipe': {
      leaf();
      const target = 'state.' + data.state + (data.path ? '.' + data.path : '');
      return makeNode({ recipe: make('RmtPrimitiveValue', at('recipe'), { kind: 'literal', value: data.recipe }), target,
        ...(fields.value ? { valueExpression: serializePrimitive(data.value), valueTokens: [] } : { valueExpression: '', valueTokens: [] }) });
    }
    case 'emit': {
      leaf();
      const payload = data.payload;
      if (payload && payload.kind !== 'object') bad('Emit payload requires a closed object expression.', 'payload');
      return makeNode({ event: data.event, payload: (payload?.fields || []).map(field => ({ key: field.key, value: field.value })) });
    }
    case 'result-handler': {
      leaf(); let tokens;
      const allowed = data.kind === 'reduce' ? ['phase', 'kind', 'state', 'path', 'value'] : data.kind === 'emit'
        ? ['phase', 'kind', 'event', 'payload'] : ['phase', 'kind', 'target', 'message', 'tone'];
      for (const key of Object.keys(fields)) if (!allowed.includes(key)) bad(`${key} is not valid for a ${data.kind} result handler.`, key);
      if (data.kind === 'reduce') {
        if (!fields.state || !fields.value) bad('A reduce result handler requires state and value.');
        tokens = ['reduce', 'state.' + data.state + (data.path ? '.' + data.path : ''), '=', serializePrimitive(data.value)];
      } else if (data.kind === 'emit') {
        if (!fields.event) bad('An emit result handler requires event.');
        const payload = data.payload;
        if (payload && payload.kind !== 'object') bad('A result Emit payload requires an object expression.', 'payload');
        tokens = ['emit', identifierText(data.event)];
        if (payload?.fields.length) tokens.push('with', ...payload.fields.flatMap(field => {
          if (!/^[A-Za-z_$][\w$-]*(?:\.[A-Za-z_$][\w$-]*)*$/u.test(field.key)) bad('Result Emit fields require safe static symbol names.', 'payload');
          return [identifierText(field.key), serializePrimitive(field.value)];
        }));
      } else {
        if (!fields.target) bad('An overlay result handler requires target.');
        tokens = ['overlay', identifierText(data.target)];
        for (const key of ['message', 'tone']) if (fields[key]) tokens.push(key, serializePrimitive(data[key]));
      }
      return makeNode({ phase: data.phase, effect: { kind: data.kind, text: tokens.join(' '), tokens } });
    }
    case 'validation-field': return makeNode({ field: data.field, rules: lowerChildren() });
    case 'validation-rule': {
      leaf();
      const v = fields.value ? data.value : make('RmtPrimitiveValue', node, { kind: 'literal', value: true });
      if (v.kind !== 'literal') bad('Validation rules require scalar literals.', 'value');
      if (['required', 'email'].includes(data.kind) && v.value !== true) bad(`${data.kind} requires true.`, 'value');
      if (['minLength', 'maxLength'].includes(data.kind) && (!Number.isSafeInteger(v.value) || v.value < 0)) bad(`${data.kind} requires a nonnegative safe integer.`, 'value');
      if (['pattern', 'message'].includes(data.kind) && typeof v.value !== 'string') bad(`${data.kind} requires a string.`, 'value');
      return makeNode({ kind: data.kind, value: v });
    }
    case 'spring-fields': leaf(); return makeNode({ fields: fieldsObject(['stiffness', 'damping', 'mass', 'velocity'], 'RmtAnimationSpringField') });
    case 'keyframe-fields': leaf(); return makeNode({ phase: data.phase, fields: fieldsObject(['opacity', 'transform', 'filter', 'offset'], 'RmtAnimationKeyframeField') });
    case 'timeline': {
      const steps = lowerChildren(); if (!steps.length) bad('A timeline requires at least one structured step.');
      return makeNode({ text: steps.map(step => step.text).join('\n'), steps });
    }
    case 'timeline-step': {
      leaf(); const tokens = [data.kind];
      if (data.kind === 'stagger') {
        if (!fields.eachMs) bad('A stagger step requires eachMs.');
        tokens.push(String(data.eachMs.value)); if (fields.phase) tokens.push(data.phase);
      } else if (fields.eachMs || fields.phase) bad('eachMs and phase are only valid for stagger steps.');
      for (const key of ['delayMs', 'durationMs']) if (fields[key]) {
        if (data[key].value < 0) bad(`${key} must be nonnegative.`, key);
        tokens.push(key, String(data[key].value));
      }
      return tokenNode(tokens);
    }
    case 'policy-tokens': {
      leaf(); const values = data.values;
      if (values.kind !== 'array' || !values.items.length || !values.items.every(item => item.kind === 'literal')) bad('Policy values must be a nonempty array of scalar literals.', 'values');
      return tokenNode([data.name, ...values.items.map(item => safeToken(item.value, 'values'))]);
    }
    case 'dispose-tokens': leaf(); return tokenNode(['on', data.on]);
    case 'preserve-tokens': leaf(); return tokenNode([data.value]);
    case 'destroy-tokens': leaf(); return tokenNode(['resource', data.resource]);
    case 'bounds-fields': leaf(); return makeNode({ fields: Object.keys(rule.attributes).filter(key => fields[key]).map(key => ({ key, value: staticPrimitive(key) })) });
    case 'search-weight': leaf(); return makeNode({ field: data.field, value: data.value });
    case 'search-value': leaf(); return makeNode({ keyword: data.name, value: data.value });
    case 'lifecycle': {
      const body = childrenOnce(), sources = body.filter(child => child.type === 'RmtSourceClause'), policies = body.filter(child => child.type === 'RmtPolicyBlock');
      if (op === 'Stream' && sources.length !== 1) bad('Stream requires exactly one Source.');
      return makeNode({ target: identifier(data.target, at('target')), source: sources[0] || null, condition: null, policy: policies[0] || null });
    }
    case 'remote-target': leaf(); return makeNode({ surface: data.surface, lane: data.lane,
      target: { type: data.targetKind, ref: data.target.startsWith(data.targetKind + ':') ? data.target : data.targetKind + ':' + data.target,
        targetNode: identifier(data.targetKind, at('targetKind')) } });
    case 'remote-from': leaf(); return makeNode({ source: { type: data.kind,
      ref: data.ref.startsWith(data.kind + ':') ? data.ref : data.kind + ':' + data.ref, targetNode: identifier(data.kind, at('kind')) } });
    case 'remote-event': return makeNode({ surface: data.surface, kind: data.kind, event: data.event, body: childrenOnce() });
    case 'import': leaf(); return makeNode({ path: data.path, mode: data.mode || (data.path.includes('*') ? 'static_glob' : 'static_file') });
    default: throw new TypeError('Unknown closed RMTX lowering mode.');
  }
}
module.exports = { lowerExtendedOperator };
