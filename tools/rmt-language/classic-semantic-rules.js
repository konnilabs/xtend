'use strict';

const unsafe = path => String(path).split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part));
const scalarTypes = new Set(['string', 'number', 'boolean', 'object', 'array', 'collection']);
function initialValue(node) {
  if (node.kind === 'literal' || node.kind === 'path') return node.value;
  if (node.kind === 'array') return node.items.map(initialValue);
  if (node.kind === 'object') return Object.fromEntries(node.fields.map(field => [field.key, initialValue(field.value)]));
}
function matchesType(type, value) {
  if (type.endsWith('[]')) return Array.isArray(value) && value.every(entry => matchesType(type.slice(0, -2), entry));
  if (type === 'array' || type === 'collection') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (['string', 'number', 'boolean'].includes(type)) return typeof value === type;
  return true; // Nominal application contracts are resolved by their owning host/schema.
}
function operand(text) {
  const expression = text.trim();
  if (/^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')$/u.test(expression)) return { literalType: 'string' };
  if (/^-?\d+(?:\.\d+)?$/u.test(expression)) return { literalType: 'number' };
  if (['true', 'false'].includes(expression)) return { literalType: 'boolean' };
  if (expression === 'null') return { literalType: 'null' };
  if (/^(?:state|selector|input|result|error|payload)(?:\.[A-Za-z_][A-Za-z0-9_-]*)*$/u.test(expression)) return { path: expression };
  return null;
}

function validateClassicSemantics(state, { diagnostic, reference }) {
  const { indexes } = state;
  function report(node, code, message) { state.diagnostics.push(diagnostic({ node, code: `rmt.classic.${code}`, severity: 'error', message })); }
  function resolvePath(domain, path) {
    const parts = path.split('.');
    while (parts.length) {
      const target = indexes[domain].byId.get(parts.join('.'));
      if (target) return target;
      parts.pop();
    }
    return null;
  }
  function read(node, path, action, selector) {
    if (unsafe(path)) { report(node, 'ref.unsafe', `Unsafe reference ${path}.`); return null; }
    const [kind, ...parts] = path.split('.');
    if (kind === 'input') {
      const inputs = (action?.body || []).filter(child => child.type === 'RmtActionInputClause');
      const input = inputs.filter(input => parts.join('.') === input.name || parts.join('.').startsWith(`${input.name}.`)).sort((a, b) => b.name.length - a.name.length)[0];
      if (!input) report(node, 'ref.input_unknown', `Unknown Action input ${parts.join('.')}.`);
      return input && parts.join('.') === input.name ? input.dataType.value : null;
    }
    if (!['state', 'selector'].includes(kind)) return null; // Explicit host result/error/payload contexts.
    const domain = kind === 'state' ? 'states' : 'selectors';
    const target = resolvePath(domain, parts.join('.'));
    const pointer = node.astPointer || null;
    if (!state.references.records.some(entry => entry.sourcePointer === pointer && entry.targetDomain === domain && entry.targetId === (target?.id || parts.join('.')))) {
      reference({ sourceDomain: selector ? 'selectors' : 'actions', sourceId: selector?.name || action?.name,
        field: 'operand', relationship: `classic.operand.${kind}`, targetDomain: domain,
        targetId: target?.id || parts.join('.'), target, node });
    }
    return domain === 'states' && target?.id === parts.join('.') ? target.node.dataType?.value : null;
  }
  function reducer(node, action, target, expression, targetAlreadyIndexed = true, assignment = true) {
    if (!target.startsWith('state.') || unsafe(target)) { report(node, 'ref.reducer_target', 'Reducer target must be a safe state.<symbol>[.<field>] reference.'); return; }
    const stateTarget = resolvePath('states', target.slice(6));
    if (!targetAlreadyIndexed) reference({ sourceDomain: 'actions', sourceId: action?.name, field: 'reduce', relationship: 'classic.reduce.state',
      targetDomain: 'states', targetId: stateTarget?.id || target.slice(6), target: stateTarget, node });
    const source = operand(expression);
    if (!source) { report(node, 'operand.unsupported', 'Reducer values must be scalar literals or explicit state/selector/input/result/error/payload paths.'); return; }
    const sourceType = source.path ? read(node, source.path, action, null) : source.literalType;
    const targetType = stateTarget?.node.dataType?.value;
    if (assignment && stateTarget && target === `state.${stateTarget.id}` && scalarTypes.has(targetType) && sourceType && targetType !== sourceType
      && !(targetType === 'collection' && sourceType === 'array')) report(node, 'type.mismatch', `Reducer assigns ${sourceType} to ${targetType} State ${stateTarget.id}.`);
  }
  function walk(node, action = null, selector = null) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(child => walk(child, action, selector)); return; }
    if (node.type === 'RmtActionDeclaration') action = node;
    if (node.type === 'RmtSelectorDeclaration') selector = node;
    if (node.type === 'RmtStateDeclaration' && node.dataType) {
      const initial = node.initial ? initialValue(node.initial) : node.body.find(child => child.type === 'RmtInitialBlock');
      if (initial !== undefined) {
        const value = node.initial ? initial : Object.fromEntries(initial.body.map(entry => [entry.key, initialValue(entry.value)]));
        if (!matchesType(node.dataType.value, value)) report(node, 'type.mismatch', `Initial value does not match State type ${node.dataType.value}.`);
      }
    }
    if (selector && ['RmtSelectorExpression', 'RmtConditionExpression'].includes(node.type) && node.kind === 'path' && ['state', 'selector'].includes(node.path[0])) read(node, node.path.join('.'), null, selector);
    if (node.type === 'RmtReducerStatement') reducer(node, action, node.target, node.expression);
    if (node.type === 'RmtReducerRecipeStatement') {
      if (node.valueExpression) reducer(node, action, node.target, node.valueExpression, false, false);
      else if (!node.target.startsWith('state.') || unsafe(node.target)) report(node, 'ref.reducer_target', 'Recipe target must be a safe State reference.');
      else {
        const target = resolvePath('states', node.target.slice(6));
        reference({ sourceDomain: 'actions', sourceId: action?.name, field: 'recipe', relationship: 'classic.recipe.state',
          targetDomain: 'states', targetId: target?.id || node.target.slice(6), target, node });
      }
    }
    if (node.type === 'RmtActionStatusClause') {
      read(node, node.path.startsWith('state.') ? node.path : `state.${node.path}`, action, null);
    }
    if (node.type === 'RmtEmitStatement') for (const field of node.payload) {
      if (field.value.kind === 'path' && /^(?:state|selector|input)\./u.test(field.value.value)) read(field.value, field.value.value, action, null);
    }
    if (node.type === 'RmtActionResultHandler' && node.effect.kind === 'reduce') {
      const match = /^reduce\s+(\S+)\s*=\s*(.+)$/u.exec(node.effect.text);
      if (!match) report(node, 'operand.unsupported', 'Result reducer requires a State target and declarative value.');
      else reducer(node, action, match[1], match[2], false);
    }
    if (node.type === 'RmtValidationDeclaration') for (const include of node.body.filter(child => child.type === 'RmtValidationIncludeClause')) {
      reference({ sourceDomain: 'validations', sourceId: node.name, field: 'include', relationship: 'classic.validation.include',
        targetDomain: 'validations', targetId: include.ref, node: include });
    }
    for (const key of ['body', 'payload', 'expression', 'left', 'right', 'argument', 'args']) walk(node[key], action, selector);
  }
  walk(state.ast);
  for (const domain of ['selectors', 'validations']) {
    const adjacency = new Map(indexes[domain].records.map(entry => [entry.id, []]));
    for (const edge of state.references.records) if (edge.sourceDomain === domain && edge.targetDomain === domain && edge.resolved) adjacency.get(edge.sourceId)?.push(edge);
    const colors = new Map();
    for (const id of adjacency.keys()) {
      if (colors.has(id)) continue;
      const stack = [{ id, index: 0 }]; colors.set(id, 1);
      while (stack.length) {
        const top = stack[stack.length - 1];
        const edge = adjacency.get(top.id)[top.index++];
        if (!edge) { colors.set(top.id, 2); stack.pop(); continue; }
        if (colors.get(edge.targetId) === 1) report({ range: edge.sourceRange, astPointer: edge.sourcePointer }, 'ref.cycle',
          `Cyclic ${domain} dependency: ${stack.map(entry => entry.id).concat(edge.targetId).join(' -> ')}.`);
        else if (!colors.has(edge.targetId)) { colors.set(edge.targetId, 1); stack.push({ id: edge.targetId, index: 0 }); }
      }
    }
  }
}

module.exports = { validateClassicSemantics };
