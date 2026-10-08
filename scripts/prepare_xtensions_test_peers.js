#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');

function npmCommand(args, options) {
  // Match the repository's normal Windows shim invocation; no shell on POSIX.
  const result = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || process.env.COMSPEC || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd', ...args], options)
    : spawnSync('npm', args, options);
  if (result.error || result.status !== 0) throw result.error || new Error(`npm ${args.join(' ')} failed (${result.status})\n${result.stderr}\n${result.stdout}`);
  return result.stdout;
}
function prepareXTensionsTestPeers({ rootDir = path.resolve(__dirname, '..') } = {}) {
  const source = path.join(rootDir, 'tests/xtensions/runtime-peers');
  const manifest = fs.readFileSync(path.join(source, 'package.json'));
  const lock = fs.readFileSync(path.join(source, 'package-lock.json'));
  const fingerprint = createHash('sha256').update(manifest).update(lock).digest('hex');
  const peerRoot = path.resolve(process.env.XTENSIONS_TEST_PEERS || path.join(os.tmpdir(), `xtend-runtime-peers-${fingerprint.slice(0,16)}`));
  const repo = fs.realpathSync(rootDir);
  fs.mkdirSync(peerRoot, { recursive: true });
  const real = fs.realpathSync(peerRoot);
  if (real === repo || real.startsWith(repo + path.sep)) throw new Error('XTENSIONS_TEST_PEERS must be outside the repository/workspaces.');
  const marker = path.join(peerRoot, '.xtend-peers-ready.json');
  let ready;
  try { ready = JSON.parse(fs.readFileSync(marker, 'utf8')); } catch {}
  const unchanged = ['package.json', 'package-lock.json'].every((name) => {
    try { return fs.readFileSync(path.join(peerRoot,name)).equals(name === 'package.json' ? manifest : lock); } catch { return false; }
  });
  if (!unchanged || ready?.fingerprint !== fingerprint || ready?.node !== process.version) {
    // Explicit destinations may contain user-managed installs: never overwrite them.
    if (process.env.XTENSIONS_TEST_PEERS && !unchanged) throw new Error('Explicit peer installation must contain the committed test-only manifest and lock.');
    fs.rmSync(marker, { force: true });
    fs.writeFileSync(path.join(peerRoot,'package.json'),manifest);
    fs.writeFileSync(path.join(peerRoot,'package-lock.json'),lock);
    npmCommand(['ci','--prefix',peerRoot,'--ignore-scripts','--no-audit','--fund=false'], { cwd: peerRoot, encoding:'utf8', timeout:180000, maxBuffer:16*1024*1024 });
  }
  const peers = createRequire(path.join(peerRoot,'package.json'));
  const pkg = JSON.parse(manifest);
  for (const [name,version] of Object.entries(pkg.dependencies)) {
    // Metadata checks retain exact versions, including tools used by acceptance.
    const actual = peers(`${name}/package.json`).version;
    if (actual !== version) throw new Error(`Isolated test peer ${name}: expected ${version}, got ${actual}`);
  }
  fs.writeFileSync(marker,JSON.stringify({fingerprint,node:process.version})+'\n');
  return { peerRoot, fingerprint, versions:pkg.dependencies };
}
if (require.main === module) {
  try { console.log(JSON.stringify(prepareXTensionsTestPeers(),null,2)); }
  catch (error) { console.error(error); process.exitCode=1; }
}
module.exports = { prepareXTensionsTestPeers, npmCommand };
