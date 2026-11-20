'use strict';
const { createHash } = require('crypto');
const path = require('path');
const { compileRmtVNextSource } = require('./vnext-compiler');
const RMT_COMPILATION_SESSION_API_VERSION = '2.0.0';
const RMT_COMPILATION_SESSION_SCHEMA = 'xtend.rmt.compilation-session.v2';
const projectCompilerRoots = new WeakMap();

// Internal read-only authentication for the Maraca project-session adapter.
// Callers cannot register an arbitrary callback as a project compiler.
function getRmtProjectSessionCompilerRoot(compile) { return projectCompilerRoots.get(compile) || null; }

/** One build session shares compiler facts across Maraca and portable page output. */
function createRmtCompilationSession({ root = process.cwd(), applyDefaultDocumentId = true, readonlyResults = false, project = false, maxEntries = Infinity, ...defaults } = {}) {
  if (maxEntries !== Infinity && (!Number.isSafeInteger(maxEntries) || maxEntries < 1)) throw new TypeError('Compilation session maxEntries must be a positive safe integer.');
  const results = new Map();
  let compilations = 0, hits = 0;
  const session = {
    apiVersion: RMT_COMPILATION_SESSION_API_VERSION,
    schema: RMT_COMPILATION_SESSION_SCHEMA,
    compileSource(input, options = {}) {
      if (project || options.project === true) return session.compileProjectSource(input, options);
      if (applyDefaultDocumentId) options = { documentId: path.relative(root, input.filePath || '.').replace(/\\/gu, '/'), ...options };
      const serialized = cacheIdentity({ root: path.resolve(root), input, options });
      const key = serialized === null ? null : createHash('sha256').update(serialized).digest('hex');
      if (key !== null && results.has(key)) { hits++; return results.get(key); }
      const result = compileRmtVNextSource(input, options);
      if (readonlyResults) freezeFacts(result);
      if (key !== null) remember(key, result);
      compilations++;
      return result;
    },
    compileProjectSource(input = {}, options = {}) {
      const { createRmtProjectSnapshot, compileRmtProjectSource } = require('./rmt-project');
      let settings = { ...defaults, ...options, rootDir: root };
      delete settings.project;
      // Re-read the complete graph before considering a cache hit. Paths,
      // source language/version and transitive content are part of its identity;
      // timestamps and the unchanged entry text cannot hide dependency edits.
      const graph = createRmtProjectSnapshot(input, settings);
      if (applyDefaultDocumentId && graph.effectiveSourceProfile?.syntax !== 'rmtx') settings = { documentId: path.relative(root, path.resolve(root, typeof input === 'string' ? '.' : input.filePath || '.')).replace(/\\/gu, '/'), ...settings };
      const serialized = cacheIdentity({ apiVersion: RMT_COMPILATION_SESSION_API_VERSION, root: path.resolve(root), input, options: settings, identity: graph.identity });
      const key = graph.ok && serialized !== null ? createHash('sha256').update(serialized).digest('hex') : null;
      if (key !== null && results.has(key)) { hits++; return results.get(key); }
      const result = compileRmtProjectSource(input, settings);
      if (readonlyResults) freezeFacts(result);
      // A writer may change a dependency between snapshot and compilation.
      // Never associate that newer result with the older graph's cache key.
      if (key !== null && result.project?.identity === graph.identity) remember(key, result);
      compilations++;
      return result;
    },
    invalidate() { const count = results.size; results.clear(); return count; },
    snapshot: () => ({ compilations, hits, documents: results.size }),
    dispose() { results.clear(); }
  };
  function remember(key, result) {
    results.set(key, result);
    // A long-lived watcher must release obsolete AST/Core/Program generations.
    // The default remains unbounded for existing short-lived build sessions.
    while (results.size > maxEntries) results.delete(results.keys().next().value);
  }
  projectCompilerRoots.set(session.compileProjectSource, path.resolve(root));
  return session;
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
module.exports = { RMT_COMPILATION_SESSION_API_VERSION, RMT_COMPILATION_SESSION_SCHEMA, createRmtCompilationSession, getRmtProjectSessionCompilerRoot };
