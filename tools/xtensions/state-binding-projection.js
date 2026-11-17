// SPDX-License-Identifier: Apache-2.0
'use strict';
let projectionContracts = null;
function configureProjectionContracts(api) {
  if (projectionContracts) throw new TypeError('Projection contract tools are already bound.');
  projectionContracts = Object.freeze({ ...api });
}
const scalar = value => value === null || ['string', 'boolean', 'number'].includes(typeof value);
const binaryOps = new Set(['===', '!==', '<', '<=', '>', '>=', '&&', '||', '+', '-', '*', '/', '%']);
function visitProjection(node, visitor, depth = 0, budget = { nodes: 0 }) {
  const api = projectionContracts;
  if (!api) throw new TypeError('Projection contracts are not initialized.');
  if (depth > 64 || ++budget.nodes > 50000) throw new TypeError('Projection exceeds its closed depth/node budget.');
  api.record(node, 'Projection');
  const recurse = child => visitProjection(child, visitor, depth + 1, budget);
  switch (node.kind) {
    case 'literal': api.fields(node, ['kind', 'value'], 'Literal projection'); api.data(node.value); break;
    case 'path':
      api.fields(node, ['kind', 'root', 'symbol', 'path'], 'Path projection');
      if (!['state', 'selector'].includes(node.root)) throw new TypeError('Projection paths require Model or selector scope.');
      api.name(node.symbol); if (!Array.isArray(node.path)) throw new TypeError('Projection path must be an array.'); break;
    case 'object': api.fields(node, ['kind', 'fields'], 'Object projection'); api.record(node.fields, 'Projection fields');
      for (const [key, value] of Object.entries(node.fields)) { api.name(key); recurse(value); } break;
    case 'array': api.fields(node, ['kind', 'items'], 'Array projection');
      if (!Array.isArray(node.items)) throw new TypeError('Projection items must be an array.'); node.items.forEach(recurse); break;
    case 'conditional': api.fields(node, ['kind', 'test', 'then', 'else'], 'Conditional projection'); recurse(node.test); recurse(node.then); recurse(node.else); break;
    case 'unary': api.fields(node, ['kind', 'op', 'value'], 'Unary projection');
      if (!['!', '-', '+'].includes(node.op)) throw new TypeError('Unknown unary projection operator.'); recurse(node.value); break;
    case 'binary': api.fields(node, ['kind', 'op', 'left', 'right'], 'Binary projection');
      if (!binaryOps.has(node.op)) throw new TypeError('Unknown binary projection operator.'); recurse(node.left); recurse(node.right); break;
    default: throw new TypeError('Unknown closed projection kind.');
  }
  visitor(node);
}
function validateProjection(node) {
  const api = projectionContracts;
  if (!api) throw new TypeError('Projection contracts are not initialized.'); api.data(node);
  visitProjection(node, value => { if (value.kind === 'path') api.bindingPath(value.path, true); });
}
function mapProjection(node, mapPath) {
  switch (node.kind) {
    case 'path': return mapPath(node);
    case 'object': return { ...node, fields: Object.fromEntries(Object.entries(node.fields).map(([key, value]) => [key, mapProjection(value, mapPath)])) };
    case 'array': return { ...node, items: node.items.map(value => mapProjection(value, mapPath)) };
    case 'conditional': return { ...node, test: mapProjection(node.test, mapPath), then: mapProjection(node.then, mapPath), else: mapProjection(node.else, mapPath) };
    case 'unary': return { ...node, value: mapProjection(node.value, mapPath) };
    case 'binary': return { ...node, left: mapProjection(node.left, mapPath), right: mapProjection(node.right, mapPath) };
    default: return node;
  }
}
function evaluateProjection(node, snapshot, depth = 0) {
  const api = projectionContracts;
  if (!api) throw new TypeError('Projection contracts are not initialized.');
  if (depth > 64) throw new TypeError('Projection evaluation exceeds its depth budget.');
  const evaluate = value => evaluateProjection(value, snapshot, depth + 1);
  const boolean = value => { if (typeof value !== 'boolean') throw new TypeError('Projection condition requires a boolean, not truthiness.'); return value; };
  const number = value => { if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError('Projection arithmetic requires finite numbers.'); return value; };
  switch (node.kind) {
    case 'literal': return node.value;
    case 'path': {
      const values = node.root === 'state' ? snapshot.states : snapshot.selectors;
      if (!values || !Object.hasOwn(values, node.symbol)) throw new TypeError('Projection references an unavailable Model/selector symbol.');
      return api.readBindingPath(values[node.symbol], node.path);
    }
    case 'object': return Object.fromEntries(Object.entries(node.fields).map(([key, value]) => [key, evaluate(value)]));
    case 'array': return node.items.map(evaluate);
    case 'conditional': return evaluate(boolean(evaluate(node.test)) ? node.then : node.else);
    case 'unary': {
      const value = evaluate(node.value); return node.op === '!' ? !boolean(value) : node.op === '-' ? -number(value) : number(value);
    }
    case 'binary': {
      const left = evaluate(node.left);
      if (node.op === '&&') return boolean(left) ? boolean(evaluate(node.right)) : false;
      if (node.op === '||') return boolean(left) ? true : boolean(evaluate(node.right));
      const right = evaluate(node.right);
      if (!scalar(left) || !scalar(right)) throw new TypeError('Binary projection operands must be scalar.');
      if (node.op === '===') return left === right;
      if (node.op === '!==') return left !== right;
      if (['<', '<=', '>', '>='].includes(node.op)) {
        if (!['number', 'string'].includes(typeof left) || typeof left !== typeof right) throw new TypeError('Projection ordering requires matching string or number operands.');
        return node.op === '<' ? left < right : node.op === '<=' ? left <= right : node.op === '>' ? left > right : left >= right;
      }
      if (node.op === '+' && typeof left === 'string' && typeof right === 'string') return left + right;
      const a = number(left), b = number(right);
      const result = node.op === '+' ? a + b : node.op === '-' ? a - b : node.op === '*' ? a * b : node.op === '/' ? a / b : a % b;
      return number(result);
    }
    default: throw new TypeError('Unknown projection kind.');
  }
}
module.exports = { configureProjectionContracts, visitProjection, validateProjection, mapProjection, evaluateProjection };
