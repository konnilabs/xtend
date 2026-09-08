'use strict';
const { createHash } = require('crypto');
const path = require('path');
const { compileRmtVNextSource } = require('./vnext-compiler');

/** One build session shares compiler facts across Maraca and portable page output. */
function createRmtCompilationSession({ root = process.cwd(), applyDefaultDocumentId = true, readonlyResults = false } = {}) {
  const results = new Map();
  let compilations = 0, hits = 0;
  return {
    compileSource(input, options = {}) {
      if (applyDefaultDocumentId) options = { documentId: path.relative(root, input.filePath || '.').replace(/\\/gu, '/'), ...options };
      const serialized = cacheIdentity({ root: path.resolve(root), input, options });
      const key = serialized === null ? null : createHash('sha256').update(serialized).digest('hex');
      if (key !== null && results.has(key)) { hits++; return results.get(key); }
      const result = compileRmtVNextSource(input, options);
      if (readonlyResults) freezeFacts(result);
      if (key !== null) results.set(key, result);
      compilations++;
      return result;
    },
    snapshot: () => ({ compilations, hits, documents: results.size }),
    dispose() { results.clear(); }
  };
}

// Non-JSON options must never collapse into the same cache key.
function cacheIdentity(value) {
  const seen = new Set();
  function normalize(entry) {
    if (entry === null || typeof entry === 'string' || typeof entry === 'boolean') return entry;
    if (typeof entry === 'number' && Number.isFinite(entry)) return entry;
    if (typeof entry !== 'object' || seen.has(entry)) throw new TypeError('Uncacheable compiler input');
    if (!Array.isArray(entry) && Object.getPrototypeOf(entry) !== Object.prototype && Object.getPrototypeOf(entry) !== null) throw new TypeError('Non-JSON compiler input');
    if (Reflect.ownKeys(entry).some(key => typeof key !== 'string' || (key !== 'length' && !Object.prototype.propertyIsEnumerable.call(entry, key)) || Object.getOwnPropertyDescriptor(entry, key).get || Object.getOwnPropertyDescriptor(entry, key).set)) throw new TypeError('Non-data compiler input');
    seen.add(entry);
    const result = Array.isArray(entry) ? Array.from(entry, normalize) : Object.keys(entry).sort().map(key => [key, normalize(entry[key])]);
    seen.delete(entry);
    return { array: Array.isArray(entry), value: result };
  }
  try { return JSON.stringify(normalize(value)); } catch (_) { return null; }
}
function freezeFacts(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  Object.values(value).forEach(entry => freezeFacts(entry, seen));
  Object.freeze(value);
}
module.exports = { createRmtCompilationSession };
