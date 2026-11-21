// SPDX-License-Identifier: Apache-2.0
'use strict';
const { randomBytes } = require('node:crypto');
const path = require('node:path').posix;
const MAX_CHUNKS = 2048;
const MAX_SOURCE_BYTES = 16 * 1024 * 1024;
const MAX_URL_BYTES = 128 * 1024 * 1024;
const safePath = value => typeof value === 'string' && /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/u.test(value)
  && value.split('/').every(part => part !== '.' && part !== '..');
const url = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');

function normalizeCapturedSSRModuleBaseURL(value, required = false) {
  if (value === undefined) {
    if (required) throw new TypeError('SSR external assets require the trusted deployed moduleBaseURL.');
    return null;
  }
  if (typeof value !== 'string' || value.trim() !== value) throw new TypeError('SSR moduleBaseURL must be an absolute HTTP(S) entry URL.');
  let parsed;
  try { parsed = new URL(value); } catch { throw new TypeError('SSR moduleBaseURL must be an absolute HTTP(S) entry URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname.endsWith('/')) throw new TypeError('SSR moduleBaseURL requires a stable HTTP(S) entry without credentials, query or fragment.');
  return parsed.href;
}

function resolveCapturedSSRImportMeta(property, { moduleId, entry, moduleBaseURL, files }) {
  if (property !== 'url' || !safePath(moduleId) || !safePath(entry) || !files?.has(moduleId) || !files.has(entry)) throw new TypeError('SSR module metadata requires an original captured module.');
  const base = normalizeCapturedSSRModuleBaseURL(moduleBaseURL, true);
  const relative = path.relative(path.dirname(entry), moduleId);
  return JSON.stringify(moduleId === entry ? base : new URL(relative, base).href);
}

/** Used only after the owner has verified the genuine build and every byte.
 * One deployment base per immutable build prevents races and cache growth. */
function createCapturedSSRModuleCache() {
  const entries = new WeakMap();
  return (build, moduleBaseURL, load) => {
    if (!build || !['object','function'].includes(typeof build) || typeof load !== 'function') throw new TypeError('A captured build and module loader are required.');
    const previous = entries.get(build);
    if (previous) {
      if (previous.moduleBaseURL !== moduleBaseURL) throw new TypeError('A captured SSR build cannot change its authoritative moduleBaseURL.');
      return previous.promise;
    }
    const promise = Promise.resolve().then(load);
    entries.set(build, { moduleBaseURL, promise });
    return promise;
  };
}

/** Import an already captured, closed Rollup graph without flattening dynamic
 * imports. Flattening eagerly evaluates native browser classes under Node.
 * No filesystem module cache, ambient globals, VM evaluator or loader hook.
 * Native ESM caches data URLs: a long-lived host must bound worker lifetimes
 * for changing build revisions, since Node has no ESM unload API. The SSR
 * owner reuses this module namespace for repeated requests of the same build. */
async function importCapturedSSRGraph(output, entry) {
  if (!Array.isArray(output) || !output.length || output.length > MAX_CHUNKS || !safePath(entry)) throw new TypeError('A bounded captured SSR chunk graph is required.');
  const chunks = new Map(); let sourceBytes = 0;
  for (const chunk of output) {
    if (chunk?.type !== 'chunk' || !safePath(chunk.fileName) || typeof chunk.code !== 'string' || chunks.has(chunk.fileName)) throw new TypeError('SSR output must contain unique captured JavaScript chunks only.');
    sourceBytes += Buffer.byteLength(chunk.code);
    if (sourceBytes > MAX_SOURCE_BYTES) throw new TypeError('Captured SSR source exceeds its byte limit.');
    chunks.set(chunk.fileName, { source: chunk.code, edges: [] });
  }
  if (!chunks.has(entry)) throw new TypeError('SSR entry is absent from the captured chunk graph.');
  const { parseAst } = require('rollup/parseAst');
  function target(specifier, importer) {
    if (typeof specifier !== 'string' || !/^(?:\.\/|(?:\.\.\/)+)[A-Za-z0-9_./-]+$/u.test(specifier)) throw new TypeError('SSR chunks require literal relative captured imports.');
    const file = path.normalize(path.join(path.dirname(importer), specifier));
    if (!safePath(file) || !chunks.has(file)) throw new TypeError('SSR import escapes its captured chunk graph.');
    return file;
  }
  for (const [file, chunk] of chunks) {
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
        chunk.edges.push({ start: node.source.start, end: node.source.end, target: target(node.source.value, file), dynamic: false });
      }
      if (node.type === 'ImportExpression') {
        chunk.edges.push({ start: node.start, end: node.end, target: target(node.source.type === 'Literal' ? node.source.value : null, file), dynamic: true });
      }
      for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
    }
    walk(parseAst(chunk.source));
  }
  const nonce = randomBytes(16).toString('hex');
  const shimURL = url(`let routes;export function initialize(rows){if(routes!==undefined||!Array.isArray(rows))throw new TypeError('SSR routes are single-use.');const captured=Object.create(null);for(const [id,value]of rows){if(typeof id!=='string'||typeof value!=='string'||!value.startsWith('data:text/javascript;base64,')||Object.hasOwn(captured,id))throw new TypeError('Invalid captured SSR route.');captured[id]=value;}routes=Object.freeze(captured);}export function resolve(id){if(!routes||!Object.hasOwn(routes,id))throw new TypeError('Unknown captured SSR module.');return routes[id];}\n//# sourceURL=xtend-ssr-routes-${nonce}.mjs\n`);
  const urls = new Map(), visiting = new Set(); let urlBytes = Buffer.byteLength(shimURL);
  function build(file) {
    if (urls.has(file)) return urls.get(file);
    if (visiting.has(file)) throw new TypeError('Static SSR chunk cycles require a separate handoff profile.');
    visiting.add(file);
    const chunk = chunks.get(file), edits = [];
    const prefix = chunk.edges.some(edge => edge.dynamic) ? `import {resolve as __XTEND_CAPTURED_SSR_RESOLVE__} from ${JSON.stringify(shimURL)};\n` : '';
    const suffix = `\n//# sourceURL=xtend-captured-ssr-${nonce}-${file}\n`;
    let expandedBytes = Buffer.byteLength(chunk.source) + Buffer.byteLength(prefix) + Buffer.byteLength(suffix);
    // Dynamic edges deliberately do not recurse: entry -> lazy chunk -> entry
    // remains a native ESM cycle, while the static dependency graph is closed.
    for (const edge of chunk.edges) {
      const resolved = edge.dynamic ? null : build(edge.target);
      const replacementBytes = edge.dynamic ? Buffer.byteLength(`import(__XTEND_CAPTURED_SSR_RESOLVE__(${JSON.stringify(edge.target)}))`) : resolved.length + 2;
      expandedBytes += replacementBytes - Buffer.byteLength(chunk.source.slice(edge.start, edge.end));
      if (urlBytes + 28 + 4 * Math.ceil(expandedBytes / 3) > MAX_URL_BYTES) throw new TypeError('Captured SSR URL graph exceeds its byte limit.');
      const replacement = edge.dynamic ? `import(__XTEND_CAPTURED_SSR_RESOLVE__(${JSON.stringify(edge.target)}))` : JSON.stringify(resolved);
      edits.push({ ...edge, replacement });
    }
    let source = chunk.source;
    for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.replacement + source.slice(edit.end);
    source = prefix + source + suffix;
    // Check before base64 allocation; nested static URLs may be larger than
    // the original source and must not expand without a hard bound.
    const bytes = 28 + 4 * Math.ceil(Buffer.byteLength(source) / 3);
    if (urlBytes + bytes > MAX_URL_BYTES) throw new TypeError('Captured SSR URL graph exceeds its byte limit.');
    const value = url(source); urlBytes += Buffer.byteLength(value);
    urls.set(file, value); visiting.delete(file); return value;
  }
  // Validate every lazy subtree before importing or executing even the entry.
  for (const file of chunks.keys()) build(file);
  const routes = await import(shimURL);
  routes.initialize([...urls]);
  return import(urls.get(entry));
}
module.exports = { importCapturedSSRGraph, normalizeCapturedSSRModuleBaseURL, resolveCapturedSSRImportMeta, createCapturedSSRModuleCache };
