// SPDX-License-Identifier: Apache-2.0
'use strict';

// Source7/8 build printer only. The result is an ordinary JavaScript data literal
// with shared immutable subtrees, not a new wire format or a runtime decoder.
function createNativeDataLiteral(input) {
  const json = JSON.stringify(input);
  if (json === undefined) return 'undefined';
  const value = JSON.parse(json), strings = new Map(), trees = new Map(), keys = new WeakMap();
  const bytes = source => Buffer.byteLength(source);
  const property = key => /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(key) && key !== '__proto__' ? key : key === '__proto__' ? '["__proto__"]' : JSON.stringify(key);
  function string(value, key) {
    let entry = strings.get(value);
    if (!entry) { entry = { value, literal: JSON.stringify(value), keys: 0, values: 0 }; strings.set(value, entry); }
    entry[key ? 'keys' : 'values']++;
  }
  function scan(node) {
    if (typeof node === 'string') { string(node, false); return; }
    if (!node || typeof node !== 'object') return;
    const key = JSON.stringify(node); keys.set(node, key);
    const entry = trees.get(key); if (entry) entry.count++; else trees.set(key, { value: node, key, count: 1 });
    if (Array.isArray(node)) node.forEach(scan);
    else for (const [key, child] of Object.entries(node)) { string(key, true); scan(child); }
  }
  scan(value);
  const stringPool = new Map([...strings.values()].filter(entry => {
    const literal = bytes(entry.literal), key = bytes(property(entry.value));
    return entry.values * (literal - 4) + entry.keys * (key - 6) > literal + 16;
  }).sort((a, b) => a.value < b.value ? -1 : a.value > b.value ? 1 : 0).map((entry, index) => [entry.value, { ...entry, name: '$s' + index.toString(36) }]));
  const treePool = new Map([...trees.values()].filter(entry => entry.count > 1 && bytes(entry.key) >= 96).sort((a, b) => a.key.length - b.key.length || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)).map((entry, index) => [entry.key, { ...entry, name: '$o' + index.toString(36) }]));
  function emit(node, own, usage) {
    if (typeof node === 'string') {
      const entry = stringPool.get(node);
      if (entry) { if (usage) usage.strings.set(node, (usage.strings.get(node) || 0) + 1); return entry.name; }
      return JSON.stringify(node);
    }
    if (!node || typeof node !== 'object') return JSON.stringify(node);
    const key = keys.get(node), entry = treePool.get(key);
    if (entry && key !== own) { if (usage) usage.trees.set(key, (usage.trees.get(key) || 0) + 1); return entry.name; }
    if (Array.isArray(node)) return '[' + node.map(child => emit(child, null, usage)).join(',') + ']';
    return '{' + Object.entries(node).map(([key, child]) => {
      const entry = stringPool.get(key), plain = property(key);
      const use = entry && bytes(entry.name) + 2 < bytes(plain);
      if (use && usage) usage.strings.set(key, (usage.strings.get(key) || 0) + 1);
      return (use ? '[' + entry.name + ']' : plain) + ':' + emit(child, null, usage);
    }).join(',') + '}';
  }
  // Remove nested pools that stopped being repeated after their parent was
  // shared. No object is reconstructed, cloned at runtime or schema-cast.
  for (;;) {
    const usage = { trees: new Map(), strings: new Map() }; emit(value, null, usage);
    for (const entry of treePool.values()) emit(entry.value, entry.key, usage);
    let changed = false;
    for (const [key, entry] of treePool) if ((usage.trees.get(key) || 0) < 2) { treePool.delete(key); changed = true; }
    if (!changed) break;
  }
  const declarations = [];
  for (const entry of stringPool.values()) declarations.push(entry.name + '=' + entry.literal);
  for (const entry of treePool.values()) declarations.push(entry.name + '=' + emit(entry.value, entry.key));
  const expression = declarations.length ? '(()=>{const ' + declarations.join(',') + ';return ' + emit(value) + ';})()' : emit(value);
  return bytes(expression) < bytes(json) || json.includes('"__proto__":') ? expression : json;
}

module.exports = { createNativeDataLiteral };
