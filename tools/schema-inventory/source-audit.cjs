'use strict';
// Private migration tooling. This module is intentionally absent from npm exports.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { isBuiltin } = require('node:module');

function assertSourceCheckout({ coreRoot, coreSha }) {
  if (!/^[a-f0-9]{40}$/.test(coreSha || '') || !path.isAbsolute(coreRoot || ''))
    throw Error('Exact absolute audit source and Core commit required');
  const git = args => execFileSync('git', args, { cwd: coreRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (git(['rev-parse', 'HEAD']).trim() !== coreSha || git(['status', '--porcelain', '--untracked-files=no']).trim())
    throw Error('Audit requires clean exact committed Core source');
  // Check complete private executable closure and data before loading it. No
  // ignored/untracked shadow module may substitute for a committed dependency.
  const queue = ['tools/schema-inventory/index.cjs', 'tools/schema-inventory/source-audit.cjs'];
  const seen = new Set();
  for (const relative of queue) {
    if (seen.has(relative)) continue;
    seen.add(relative);
    const file = path.join(coreRoot, relative);
    if (fs.realpathSync(file) !== path.resolve(file) || !fs.lstatSync(file).isFile()) throw Error('Audit source symlink rejected');
    const bytes = fs.readFileSync(file);
    const expected = execFileSync('git', ['show', coreSha + ':' + relative], { cwd: coreRoot, maxBuffer: 64 * 1024 * 1024 });
    if (!bytes.equals(expected)) throw Error('Audit source differs from committed Core: ' + relative);
    if (/\.(?:js|cjs)$/.test(relative)) for (const match of bytes.toString('utf8').matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const name = match[1];
      if (isBuiltin(name)) continue;
      if (!name.startsWith('.')) throw Error('Unbound audit module: ' + name);
      const base = path.resolve(path.dirname(file), name);
      if (!base.startsWith(coreRoot + path.sep)) throw Error('Audit module escaped source');
      const found = [base, base + '.js', base + '.cjs', base + '.json'].find(f => fs.existsSync(f) && fs.statSync(f).isFile());
      if (!found) throw Error('Missing audit dependency: ' + name);
      queue.push(path.relative(coreRoot, found));
    }
  }
  return { coreRoot, coreSha, files: [...seen].sort() };
}

function loadSourceAudit(options) {
  assertSourceCheckout(options);
  const actualRoot = fs.realpathSync(path.resolve(__dirname, '../..'));
  if (actualRoot !== fs.realpathSync(options.coreRoot)) throw Error('Audit loaded from another Core checkout');
  const api = require('./index.cjs');
  return Object.freeze({
    createScanner(parser) { assertSourceCheckout(options); return api.createScanner(parser); },
    verifyPair(args) { assertSourceCheckout(options); return api.verifySourcePair({ ...args, ...options }); },
    importAuthorities(args) { assertSourceCheckout(options); return api.importSourceAuthorities({ ...args, ...options }); }
  });
}
module.exports = { assertSourceCheckout, loadSourceAudit };
