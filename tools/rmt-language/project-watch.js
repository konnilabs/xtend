'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const { createRmtCompilationSession } = require('./compilation-session');
const RMT_PROJECT_WATCH_API_VERSION = '1.0.0';
const RMT_PROJECT_WATCH_SCHEMA = 'xtend.rmt.project-watch.v1';

/** Content polling also observes missing imports and parent-directory renames. */
function createRmtProjectWatcher(options = {}) {
  const root = path.resolve(options.rootDir || options.root || process.cwd());
  const filePath = path.resolve(root, options.entryFile || options.filePath || 'app.rmt');
  const intervalMs = options.intervalMs === undefined ? 200 : Number(options.intervalMs);
  if (!Number.isFinite(intervalMs) || intervalMs < 20 || intervalMs > 60000) throw new TypeError('Project watch interval must be between 20 and 60000 milliseconds.');
  if (options.onResult !== undefined && typeof options.onResult !== 'function') throw new TypeError('Project watch onResult must be a function.');
  const session = createRmtCompilationSession({ root, applyDefaultDocumentId: false, readonlyResults: true, maxEntries: 1 });
  const settings = { ...options, rootDir: root, semanticCheck: true };
  for (const key of ['onResult', 'intervalMs', 'entryFile', 'filePath']) delete settings[key];
  let timer = null, identity = null, closed = false, updates = 0;
  const watcher = {
    apiVersion: RMT_PROJECT_WATCH_API_VERSION, schema: RMT_PROJECT_WATCH_SCHEMA,
    poll() {
      if (closed) throw new Error('Project watcher is disposed.');
      const result = session.compileProjectSource({ filePath }, settings);
      // Failed/missing imports must also produce stable, observable identities.
      const next = crypto.createHash('sha256').update(JSON.stringify([result.project?.identity || null, result.ok, result.diagnostics || []])).digest('hex');
      const changed = next !== identity;
      if (changed) { identity = next; updates++; options.onResult?.(result); }
      return { changed, identity, result };
    },
    start() {
      if (closed) throw new Error('Project watcher is disposed.');
      if (!timer) { watcher.poll(); timer = setInterval(() => watcher.poll(), intervalMs); }
      return watcher;
    },
    snapshot: () => ({ updates, running: timer !== null, closed, ...session.snapshot() }),
    dispose() { if (timer) clearInterval(timer); timer = null; closed = true; session.dispose(); }
  };
  return Object.freeze(watcher);
}
module.exports = { RMT_PROJECT_WATCH_API_VERSION, RMT_PROJECT_WATCH_SCHEMA, createRmtProjectWatcher };
