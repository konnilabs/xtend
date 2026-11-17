'use strict';

// Closed compile-time lowering of the already accepted Action result syntax.
// No handler source text is evaluated or shipped to an executor as code.
const { parseRmtVNextSource, tokenizeVNextSource } = require('./vnext-parser');
const { createRmtSourceModel } = require('./source-model');
const safe = value => !String(value).split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part));
const reference = (value, options = {}) => (options.allowTemplates === true
  ? /^(?:state|selector|input|result|error|payload)(?:\.[A-Za-z_$][A-Za-z0-9_$-]*)*$/u
  : /^(?:state|selector|input|result|error|payload)(?:\.[A-Za-z_][A-Za-z0-9_-]*)*$/u).test(value) && safe(value);
const overlayTones = new Set(['info', 'success', 'warning', 'error', 'neutral', 'primary', 'secondary', 'danger']);

function reject(message) { throw new TypeError(message); }
function primitiveData(node) {
  if (node.kind === 'literal' || node.kind === 'path') return node.value;
  if (node.kind === 'array') return node.items.map(primitiveData);
  if (node.kind === 'object') return Object.fromEntries(node.fields.map(field => [field.key, primitiveData(field.value)]));
  return reject('Unsupported Action value.');
}
function valueTree(node, options) {
  if (node.kind === 'literal') return { kind: 'literal', value: node.value };
  if (node.kind === 'path') {
    if (!reference(node.value, options)) reject('Action references must use safe state/selector/input/result/error/payload paths.');
    return { kind: 'path', value: node.value };
  }
  if (node.kind === 'array') return { kind: 'array', items: node.items.map(value => valueTree(value, options)) };
  if (node.kind === 'object') {
    const names = new Set();
    return { kind: 'object', fields: node.fields.map(field => {
      if (!safe(field.key) || names.has(field.key)) reject('Action values require unique safe object keys.');
      names.add(field.key); return { key: field.key, value: valueTree(field.value, options) };
    }) };
  }
  return reject('Unsupported Action value.');
}
function hasPath(node) {
  return node.kind === 'path' || node.kind === 'array' && node.items.some(hasPath) || node.kind === 'object' && node.fields.some(field => hasPath(field.value));
}
function lowerPrimitiveActionValue(node, options = {}) {
  const tree = valueTree(node, options); // Also checks nested keys and reference namespaces.
  if (node.kind === 'path') return { value: node.value, valueKind: 'reference' };
  if (hasPath(node)) return { value: tree, valueKind: 'template' };
  return { value: primitiveData(node), valueKind: 'literal' };
}
function lowerActionExpression(expression, options = {}) {
  const text = String(expression || '').trim();
  if (reference(text, options)) return { value: text, valueKind: 'reference' };
  if (/^-?\d+(?:\.\d+)?$/u.test(text)) {
    const value = Number(text);
    if (!Number.isFinite(value)) reject('Action numeric literals must be finite.');
    return { value, valueKind: 'literal' };
  }
  if (['true', 'false', 'null'].includes(text)) return { value: JSON.parse(text), valueKind: 'literal' };
  const parsed = parseRmtVNextSource(`state __value type string initial ${text}\n`);
  const node = parsed.ast?.body?.[0]?.initial;
  if (options.allowTemplates === true && parsed.ok && parsed.ast.body.length === 1 && ['array', 'object', 'path'].includes(node?.kind))
    return lowerPrimitiveActionValue(node, options);
  if (options.allowTemplates === true && parsed.ok && parsed.ast.body.length === 1 && node?.kind === 'literal'
      && typeof node.value === 'number' && Number.isFinite(node.value)) return lowerPrimitiveActionValue(node);
  if (!parsed.ok || parsed.ast.body.length !== 1 || node?.kind !== 'literal' || typeof node.value !== 'string') reject('Action reducer values require a scalar literal or an explicit reference.');
  return { value: node.value, valueKind: 'literal' };
}
function lowerActionEmit(node, options = {}) {
  if (!safe(node.event)) reject('Unsafe emitted event name.');
  const names = new Set();
  return { event: node.event, payload: node.payload.map(entry => {
    if (!entry.key || !safe(entry.key) || names.has(entry.key)) reject('Emit payloads require unique safe field names.');
    names.add(entry.key); return { name: entry.key, ...lowerPrimitiveActionValue(entry.value, options) };
  }) };
}
function lowerActionResultHandler(handler, options = {}) {
  const features = options;
  if (!['success', 'error'].includes(handler.phase)) reject('Action result handlers support success and error phases only.');
  const text = String(handler.effect?.text || '').trim();
  if (options.allowTemplates === true && handler.effect?.kind === 'reduce') {
    // The legacy Action statement collector has no nested-expression boundary.
    // Parse only the closed primitive operand with the existing value parser;
    // this opt-in cannot inject a second operation or executable source.
    const match = /^reduce\s+(state\.[A-Za-z_$][A-Za-z0-9_$-]*(?:\.[A-Za-z_$][A-Za-z0-9_$-]*)*)\s*=\s*([\s\S]+)$/u.exec(text);
    if (!match || !safe(match[1])) reject('Result reducers require a safe State target and one closed value.');
    return { phase: handler.phase, kind: 'reduce', reducer: { target: match[1], ...lowerActionExpression(match[2], options) } };
  }
  if (handler.effect?.kind === 'reduce' || handler.effect?.kind === 'emit') {
    const parsed = parseRmtVNextSource(`action __handler {\n${text}\n}`);
    const children = parsed.ast?.body?.[0]?.body;
    if (!parsed.ok || parsed.ast.body.length !== 1 || children?.length !== 1) reject('A result handler must contain exactly one declarative operation.');
    const node = children[0];
    if (handler.effect.kind === 'reduce' && node.type === 'RmtReducerStatement') {
      if (!node.target.startsWith('state.') || !safe(node.target)) reject('Result reducers require a safe State target.');
      return { phase: handler.phase, kind: 'reduce', reducer: { target: node.target, ...lowerActionExpression(node.expression, options) } };
    }
    if (handler.effect.kind === 'emit' && node.type === 'RmtEmitStatement') return { phase: handler.phase, kind: 'emit', emit: lowerActionEmit(node, features) };
    return reject('Result handler kind differs from its operation.');
  }
  if (handler.effect?.kind === 'overlay') {
    const lexed = tokenizeVNextSource(createRmtSourceModel({ text }));
    const tokens = lexed.tokens.filter(token => !['eof', 'newline'].includes(token.type));
    if (lexed.diagnostics.length || tokens[0]?.value !== 'overlay' || tokens[1]?.type !== 'identifier') reject('Invalid overlay result handler.');
    let index = 2, target = tokens[1].value;
    while (tokens[index]?.value === '.' && tokens[index + 1]?.type === 'identifier') { target += '.' + tokens[index + 1].value; index += 2; }
    if (!safe(target)) reject('Unsafe overlay target.');
    const rest = tokens[index] ? text.slice(tokens[index].startOffset) : '';
    const parsed = parseRmtVNextSource(`state __options type object initial { ${rest} }\n`);
    const node = parsed.ast?.body?.[0]?.initial;
    if (!parsed.ok || parsed.ast.body.length !== 1 || node?.kind !== 'object') reject('Invalid overlay result options.');
    const options = {};
    for (const field of node.fields) {
      if (!['message', 'tone'].includes(field.key) || Object.hasOwn(options, field.key)) reject('Overlay handlers support unique message and tone options only.');
      options[field.key] = lowerPrimitiveActionValue(field.value, features);
    }
    if (options.tone && (options.tone.valueKind === 'template' || options.tone.valueKind === 'literal' && !overlayTones.has(options.tone.value))) reject('Overlay tone must be a supported tone literal or an explicit reference.');
    return { phase: handler.phase, kind: 'overlay', target, options };
  }
  return reject('Action result handlers support reduce, emit and overlay only.');
}

module.exports = { lowerActionExpression, lowerPrimitiveActionValue, lowerActionEmit, lowerActionResultHandler };
