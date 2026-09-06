// Lossless, response-local references. Existing page and signed resume contracts
// are reconstructed before consumers see them; no reference crosses a response.
export const PAGE_WIRE_SCHEMA = 'xtend.page-wire.v1';
const MAX_NODES = 32768, MAX_DEPTH = 128, MAX_EXPANDED = 16 * 1024 * 1024;
const fail = () => { throw Object.assign(new Error('Invalid or oversized XTend page reference table.'), {code:'page.invalid_wire'}); };
const safeKey = key => !key.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part));
const primitiveSize = value => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value).length;
  return fail();
};
export function encodePageWire(page) {
  const nodes = [], interned = new Map(), ancestors = new Set();
  function encode(value, depth = 0) {
    if (depth > MAX_DEPTH) fail();
    if (value === null || typeof value !== 'object') {primitiveSize(value); return value;}
    if (ancestors.has(value)) fail();
    ancestors.add(value);
    const node = Array.isArray(value) ? value.map(child => encode(child, depth + 1)) : Object.fromEntries(Object.entries(value).map(([key, child]) => {
      if (!safeKey(key)) fail(); return [key, encode(child, depth + 1)];
    }));
    ancestors.delete(value);
    const signature = JSON.stringify(node);
    let index = interned.get(signature);
    if (index === undefined) {index = nodes.length; if (index >= MAX_NODES) fail(); nodes.push(node); interned.set(signature, index);}
    return {r:index};
  }
  let normalized;
  try {
    normalized = JSON.parse(JSON.stringify(page, (key, value) => {
      if (['function','symbol','bigint'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)) fail();
      return value;
    }));
  } catch { fail(); }
  const root = encode(normalized);
  return {schema:PAGE_WIRE_SCHEMA, root, nodes};
}
export function decodePageWire(input) {
  if (input?.schema !== PAGE_WIRE_SCHEMA) return input;
  if (!Array.isArray(input.nodes) || !input.nodes.length || input.nodes.length > MAX_NODES) fail();
  const decoded = [], sizes = [], depths = [];
  function read(value, limit) {
    if (value === null || typeof value !== 'object') return {value,size:primitiveSize(value),depth:0};
    if (Array.isArray(value) || Object.keys(value).length !== 1 || !Number.isSafeInteger(value.r) || value.r < 0 || value.r >= limit) fail();
    return {value:decoded[value.r],size:sizes[value.r],depth:depths[value.r]};
  }
  input.nodes.forEach((node, index) => {
    if (!node || typeof node !== 'object') fail();
    const array = Array.isArray(node), result = array ? [] : {};
    let size = 2, depth = 1;
    for (const [key, source] of Object.entries(node)) {
      if (!safeKey(key)) fail();
      const child = read(source, index);
      size += child.size + (array ? 1 : JSON.stringify(key).length + 2);
      depth = Math.max(depth, child.depth + 1);
      if (size > MAX_EXPANDED || depth > MAX_DEPTH) fail();
      result[key] = child.value;
    }
    decoded.push(result); sizes.push(size); depths.push(depth);
  });
  const page = read(input.root, decoded.length).value;
  if (page?.schema !== 'xtend.page-response.v1') fail();
  return page;
}
