'use strict';

// Compiler-owned copies of data-only cross-package contracts. Runtime imports
// use the internal copy; this check keeps the canonical implementation exact.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const copies = Object.freeze([{ canonical: 'xtend-maraca/fastpass-contract.js', vendored: 'tools/rmt-language/vendor/fastpass-contract.js' }]);
const manifestPath = 'tools/rmt-language/vendor/manifest.json';
const digest = buffer => createHash('sha256').update(buffer).digest('hex');

function syncRmtCompilerContracts(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, '..'));
  const entries = copies.map(entry => {
    const canonical = fs.readFileSync(path.join(rootDir, entry.canonical));
    const destination = path.join(rootDir, entry.vendored);
    let vendored = fs.existsSync(destination) ? fs.readFileSync(destination) : null;
    if (options.write === true && (!vendored || !canonical.equals(vendored))) {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, canonical);
      vendored = canonical;
    }
    return { ...entry, sha256: digest(canonical), vendoredSha256: vendored ? digest(vendored) : null,
      fresh: !!vendored && canonical.equals(vendored) };
  });
  const manifest = JSON.stringify({ version: '1.0.0', copies: entries.map(({ canonical, vendored, sha256 }) => ({ canonical, vendored, sha256 })) }, null, 2) + '\n';
  const destination = path.join(rootDir, manifestPath);
  if (options.write === true) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, manifest);
  }
  const manifestFresh = fs.existsSync(destination) && fs.readFileSync(destination, 'utf8') === manifest;
  return { ok: entries.every(entry => entry.fresh) && manifestFresh, manifest: manifestPath, manifestFresh, copies: entries };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--check', '--write', '--json'].includes(arg)) || args.includes('--check') && args.includes('--write')) {
    process.stderr.write('Usage: node scripts/sync_rmt_compiler_contracts.cjs [--check | --write] [--json]\n');
    process.exitCode = 2;
  } else {
    const result = syncRmtCompilerContracts({ write: args.includes('--write') });
    process.stdout.write(JSON.stringify(result, null, args.includes('--json') ? 2 : 0) + '\n');
    if (!result.ok) process.exitCode = 1;
  }
}

module.exports = { syncRmtCompilerContracts };
