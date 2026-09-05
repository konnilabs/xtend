'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createHash } = require('crypto');
const posix = value => String(value).replace(/\\/g, '/');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const fingerprint = value => createHash('sha256').update(value).digest('hex');
const inside = (root, file) => { const p = path.relative(root, file); return !p || (!p.startsWith('../') && p !== '..' && !path.isAbsolute(p)); };
const EXCLUDED = new Set(['.git', 'node_modules', 'dist', 'build', 'generated', '.xtend-build', '.xtend-test-results', '.project-index-cache', 'coverage', '.next']);
function excluded(file) {
  return posix(file).split('/').some(part => EXCLUDED.has(part))
    || /(?:^|\/)knowledge\//.test(file) || /(?:-build|\.min)\.(?:js|mjs|json|d\.ts)$/.test(file);
}

// Git is an optimization/source of ignore rules, never a runtime prerequisite.
// Inventory compatibility mode keeps the original git ordering and exclusions.
function discoverFiles(rootDir, options = {}) {
  const root = path.resolve(rootDir);
  let files;
  if (options.git !== false) {
    try {
      files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
        cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore']
      }).split('\0').filter(Boolean);
    } catch { /* External packages and environments without git use traversal. */ }
  }
  if (!files) {
    files = [];
    function visit(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        const relative = posix(path.relative(root, absolute));
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        if (options.inventory !== true && excluded(relative)) continue;
        if (entry.isDirectory()) visit(absolute);
        else if (entry.isFile()) files.push(relative);
        // Do not traverse symlink directories; the resolver separately checks
        // physical boundaries for explicitly imported RMT files.
        else if (entry.isSymbolicLink()) {
          try { if (inside(fs.realpathSync(root), fs.realpathSync(absolute)) && fs.statSync(absolute).isFile()) files.push(relative); } catch { /* dangling link */ }
        }
      }
    }
    visit(root);
  }
  return [...new Set(files.map(posix))].filter(file => {
    if (options.inventory !== true && excluded(file)) return false;
    try { return inside(fs.realpathSync(root), fs.realpathSync(path.join(root, file))); } catch { return options.inventory === true; }
  }).sort(compare);
}

function exportTargets(value, conditions = []) {
  if (typeof value === 'string') return [{ target: value, conditions }];
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, entry]) => exportTargets(entry, conditions.concat(key)));
}
function packageExports(files) {
  const mappings = [];
  for (const file of files.filter(file => /(?:^|\/)package\.json$/.test(file.path))) {
    let manifest;
    try { manifest = JSON.parse(file.text); } catch { continue; }
    if (typeof manifest.name !== 'string' || !manifest.exports) continue;
    const directory = path.posix.dirname(file.path);
    const entries = typeof manifest.exports === 'string' || !Object.keys(manifest.exports).some(key => key.startsWith('.'))
      ? [['.', manifest.exports]] : Object.entries(manifest.exports);
    for (const [key, value] of entries) for (const target of exportTargets(value)) {
      mappings.push({ target: posix(path.posix.join(directory, target.target)),
        module: key === '.' ? manifest.name : manifest.name + '/' + key.replace(/^\.\//, ''),
        conditions: target.conditions, manifestPath: file.path, packageName: manifest.name });
    }
  }
  return mappings;
}

// Historical scanner view deliberately preserves its public result shape.
function packageExportMappings(rootDir, files) {
  return packageExports(files).map(({ target, module }) => ({ target, module }));
}
module.exports = { discoverFiles, packageExports, packageExportMappings, exportTargets, fingerprint, compare, posix, inside };
