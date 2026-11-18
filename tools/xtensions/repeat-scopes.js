// SPDX-License-Identifier: Apache-2.0
'use strict';

// Shared Model-key traversal. Consumers provide their own projection and
// lifetime semantics; this module never creates hosts or DOM nodes.
const { fields, name, segments, readBindingPath } = require('./state-binding-contract');

function validateRepeat(repeat) {
  if (repeat === undefined) return;
  if (!Array.isArray(repeat) || !repeat.length) throw new TypeError('Repeat requires a nonempty scope chain.');
  repeat.forEach((scope, index) => {
    fields(scope, index === 0 ? ['state', 'path', 'key'] : ['path', 'key'], 'Repeat scope');
    if (index === 0) name(scope.state);
    segments(scope.path); segments(scope.key);
    if (!scope.key.length) throw new TypeError('Repeat requires an explicit nonempty item key path.');
  });
}

function templatePath(source, entry, keys) {
  if (!Array.isArray(source.path)) throw new TypeError('Binding paths must be segment arrays.');
  return source.path.map((part, position) => {
    if (!part || typeof part !== 'object' || !Object.hasOwn(part, 'repeat')) return part;
    fields(part, ['repeat'], 'Repeat path reference');
    const level = part.repeat;
    if (!entry.repeat || !Number.isSafeInteger(level) || level < 0 || Object.is(level, -0) || level >= entry.repeat.length) throw new TypeError('Unknown repeat path scope.');
    const prefix = entry.repeat.slice(0, level + 1).flatMap((scope, i) => [...scope.path, { repeat: i }]);
    if (source.state !== entry.repeat[0].state || JSON.stringify(source.path.slice(0, position + 1)) !== JSON.stringify(prefix)) throw new TypeError('Repeat paths must follow the declared Model scope chain.');
    return { key: { path: entry.repeat[level].key, value: keys[level] } };
  });
}

/** Depth-first callbacks preserve the binding materializer's error ordering. */
function expandRepeatScopes(repeat, snapshot, visit, context = {}) {
  const walk = (level, item, keys) => {
    if (repeat && level < repeat.length) {
      const scope = repeat[level];
      const collection = readBindingPath(level === 0 ? snapshot.states[scope.state] : item, scope.path);
      if (!Array.isArray(collection)) throw new TypeError('Repeat sources must be Model arrays.');
      const seen = new Set();
      for (const child of collection) {
        const key = readBindingPath(child, scope.key); segments([key]);
        const token = JSON.stringify(key);
        if (seen.has(token)) throw new TypeError('Repeat item keys must be unique within each parent scope.');
        seen.add(token); walk(level + 1, child, [...keys, key]);
      }
      return;
    }
    visit(keys, item);
  };
  walk(context.level || 0, context.item === undefined ? null : context.item, context.keys || []);
}

module.exports = { validateRepeat, templatePath, expandRepeatScopes };
