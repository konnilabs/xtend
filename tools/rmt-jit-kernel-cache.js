'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
let assemblerPath;
try { assemblerPath = require.resolve('../xtend-builder/generators/rmt-kernel-lab'); }
catch (_) { assemblerPath = require.resolve('@ccslabs/xtend/xtend-builder/generators/rmt-kernel-lab'); }
const assembler = require(assemblerPath);
const SCHEMA = 'xtend.rmt.jit-kernel-cache.v1';
const LIMIT = 128 * 1024 * 1024;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function fingerprint(snapshot, options) {
  const digest = crypto.createHash('sha256');
  digest.update(JSON.stringify([SCHEMA, snapshot.rootDir, process.version, options.version || null, snapshot.versionInfo, snapshot.architectureVersion]));
  Object.keys(snapshot.sources).sort().forEach(file => digest.update(JSON.stringify([file, snapshot.sources[file]])));
  // Include the loaded assembler and its complete local implementation closure.
  const visited = new Set();
  function implementation(mod) {
    if (!mod || visited.has(mod.filename)) return;
    visited.add(mod.filename);
    digest.update(mod.filename).update(fs.readFileSync(mod.filename));
    mod.children.forEach(implementation);
  }
  implementation(require.cache[assemblerPath]);
  digest.update(fs.readFileSync(__filename));
  return digest.digest('hex');
}

function privateDirectory(directory, rootDir) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stat = fs.lstatSync(directory);
  const real = fs.realpathSync(directory);
  const relative = path.relative(rootDir, real);
  if (stat.isSymbolicLink() || !stat.isDirectory() || (typeof process.getuid === 'function' && stat.uid !== process.getuid())
    || (stat.mode & 0o077) !== 0 || relative === '' || (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))) {
    throw new Error('Hydrangea requires a private cache directory outside the repository/webroot.');
  }
}

function readEntry(file, key) {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMIT || (stat.mode & 0o077)) return null;
    const entry = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (entry.schema !== SCHEMA || entry.key !== key || entry.integrity !== hash(JSON.stringify(entry.artifacts))) return null;
    for (const target of ['xtendrmt/rmt-manifest.json', 'xtendrmt/rmt-runtime.browser.js']) {
      const artifact = entry.artifacts && entry.artifacts[target];
      if (!artifact || artifact.ok !== true || artifact.path !== target || typeof artifact.content !== 'string'
        || artifact.sha256 !== hash(artifact.content) || !artifact.architectureReport || artifact.architectureReport.ok !== true) return null;
    }
    return entry.artifacts;
  } catch (_) { return null; }
}

function ownerAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return true;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
}

function reclaimLock(lock) {
  try {
    const stat = fs.lstatSync(lock);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    let owner;
    try { owner = JSON.parse(fs.readFileSync(lock, 'utf8')); }
    catch (_) {
      // A truncated owner record can only be reclaimed after the publication
      // window. Never expire a valid record belonging to a live process.
      if (Date.now() - stat.mtimeMs < 30000) return false;
      fs.unlinkSync(lock); return true;
    }
    if (!ownerAlive(owner.pid)) { fs.unlinkSync(lock); return true; }
  } catch (_) {}
  return false;
}

function prune(directory, keep) {
  const files = [];
  for (const name of fs.readdirSync(directory)) {
    const file = path.join(directory, name);
    try {
      const temporary = /^[a-f0-9]{64}\.json\.(\d+)\.[a-f0-9]+\.tmp$/.exec(name);
      if (temporary && !ownerAlive(Number(temporary[1]))) { fs.unlinkSync(file); continue; }
      if (/^[a-f0-9]{64}\.json$/.test(name)) {
        const stat = fs.lstatSync(file);
        if (stat.isFile()) files.push({ file, stat });
      }
    } catch (_) {} // Another process may already have pruned this generation.
  }
  files.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);
  let bytes = files.reduce((sum, entry) => sum + entry.stat.size, 0);
  for (const entry of files) {
    if (bytes <= LIMIT) break;
    if (entry.file === keep) continue;
    const lock = entry.file + '.lock';
    if (fs.existsSync(lock) && !reclaimLock(lock)) continue;
    try { fs.unlinkSync(entry.file); bytes -= entry.stat.size; } catch (_) {}
  }
}

/** Only static framework artifacts cross the process boundary. No RMT input is accepted. */
async function prepareRmtJitKernelCache(options = {}) {
  const requestedRoot = path.resolve(options.rootDir || process.cwd());
  const frameworkRoot = path.resolve(path.dirname(assemblerPath), '../..');
  const rootDir = fs.realpathSync(fs.existsSync(path.join(requestedRoot, 'xtendrmt')) ? requestedRoot : frameworkRoot);
  const snapshot = assembler.createRmtKernelSourceSnapshot({ rootDir, version: options.version });
  const key = fingerprint(snapshot, options);
  const configured = options.cacheDir || process.env.XTEND_RMT_JIT_CACHE_DIR;
  const directory = path.resolve(configured || path.join(os.tmpdir(), 'xtend-rmt-jit-' + (process.getuid ? process.getuid() : 'user') + '-' + hash(rootDir).slice(0, 16)));
  const file = path.join(directory, key + '.json');
  const lock = file + '.lock';
  let ownsLock = false;
  let writable = true;
  let cacheStatus = 'miss';
  const diagnostics = [];
  try {
    privateDirectory(directory, rootDir);
    prune(directory, file);
    const cached = readEntry(file, key);
    if (cached) return { key, artifacts: cached, cacheStatus: 'hit', architectureChecks: 0, diagnostics };
    const until = Date.now() + 2000;
    while (!ownsLock) {
      try { fs.writeFileSync(lock, JSON.stringify({ pid: process.pid }), { flag: 'wx', mode: 0o600 }); ownsLock = true; }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const cached = readEntry(file, key);
        if (cached) return { key, artifacts: cached, cacheStatus: 'hit', architectureChecks: 0, diagnostics };
        if (reclaimLock(lock)) continue;
        if (Date.now() >= until) { const busy = new Error('Hydrangea kernel cache preparation is busy.'); busy.code = 'xtend.rmt.jit.cache_busy'; throw busy; }
        await delay(20);
      }
    }
    const afterLock = readEntry(file, key);
    if (afterLock) return { key, artifacts: afterLock, cacheStatus: 'hit', architectureChecks: 0, diagnostics };
  } catch (error) {
    if (error.code === 'xtend.rmt.jit.cache_busy') throw error;
    writable = false;
    cacheStatus = 'unavailable';
    diagnostics.push({ code: 'xtend.rmt.jit.cache_unavailable', severity: 'warning', message: 'Static kernel cache unavailable; using validated in-memory artifacts.' });
  } finally {
    // A cache hit after acquiring the lock is already complete.
    if (ownsLock && readEntry(file, key)) { try { fs.unlinkSync(lock); } catch (_) {} ownsLock = false; }
  }
  try {
    const built = assembler.createRmtKernelSourceArtifacts({ rootDir, snapshot });
    if (!built.ok) {
      const failed = Object.values(built.artifacts).find(artifact => !artifact.ok);
      const error = new Error(failed.diagnostics[0] && failed.diagnostics[0].message || 'Kernel source validation failed.');
      error.code = failed.diagnostics[0] && failed.diagnostics[0].code || 'xtend.rmt.jit.kernel_invalid';
      throw error;
    }
    // Never return a generation assembled from sources that changed while it
    // was being validated, including when persistence is unavailable.
    const current = assembler.createRmtKernelSourceSnapshot({ rootDir, version: options.version });
    if (fingerprint(current, options) !== key) {
      const changed = new Error('Kernel sources changed during assembly.');
      changed.code = 'xtend.rmt.jit.sources_changed';
      throw changed;
    }
    if (writable) {
      const temporary = file + '.' + process.pid + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
      try {
        const body = JSON.stringify({ schema: SCHEMA, key, integrity: hash(JSON.stringify(built.artifacts)), artifacts: built.artifacts });
        if (Buffer.byteLength(body) > LIMIT) throw new Error('Static artifact generation exceeds cache budget.');
        {
          fs.writeFileSync(temporary, body, { flag: 'wx', mode: 0o600 });
          fs.renameSync(temporary, file);
          prune(directory, file);
        }
      } catch (error) {
        cacheStatus = 'unavailable';
        diagnostics.push({ code: 'xtend.rmt.jit.cache_write_failed', severity: 'warning', message: 'Static kernel cache could not be published.' });
      } finally { try { fs.unlinkSync(temporary); } catch (_) {} }
    }
    return { key, artifacts: built.artifacts, cacheStatus, architectureChecks: built.architectureChecks, diagnostics };
  } finally { if (ownsLock) { try { fs.unlinkSync(lock); } catch (_) {} } }
}

module.exports = { prepareRmtJitKernelCache };
