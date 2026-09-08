'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { prepareRmtJitKernelCache } = require('../../../tools/rmt-jit-kernel-cache');
const assembler = require('../../../xtend-builder/generators/rmt-kernel-lab');
const { createRmtCompilationSession } = require('../../../tools/rmt-language/compilation-session');
const { rootDir, fixtures } = require('./contracts.cjs');
async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hydrangea-cache-test-'));
  const fixtureRoot = path.join(directory, 'root');
  const cacheDir = path.join(directory, 'cache');
  fs.mkdirSync(fixtureRoot);
  const snapshot = assembler.createRmtKernelSourceSnapshot({ rootDir });
  const paths = Object.keys(snapshot.sources).concat(['xtendrmt/rmt-manifest.json', 'xtendrmt/rmt-core.esm.js']);
  for (const file of paths) {
    if (!fs.existsSync(path.join(rootDir, file))) continue;
    fs.mkdirSync(path.dirname(path.join(fixtureRoot, file)), { recursive: true });
    fs.copyFileSync(path.join(rootDir, file), path.join(fixtureRoot, file));
  }
  const options = { rootDir: fixtureRoot, cacheDir };
  try {
    const cold = await prepareRmtJitKernelCache(options);
    assert.equal(cold.architectureChecks, 1);
    for (const target of Object.keys(cold.artifacts)) {
      assert.deepStrictEqual(cold.artifacts[target], assembler.createRmtKernelSourceArtifact({ rootDir: fixtureRoot, artifactPath: target }));
    }
    const build = assembler.createRmtKernelSourceArtifacts;
    assembler.createRmtKernelSourceArtifacts = () => { throw new Error('Warm cache must not assemble'); };
    let warm;
    try { warm = await prepareRmtJitKernelCache(options); } finally { assembler.createRmtKernelSourceArtifacts = build; }
    assert.equal(warm.cacheStatus, 'hit'); assert.equal(warm.architectureChecks, 0);
    assert.deepStrictEqual(warm.artifacts, JSON.parse(JSON.stringify(cold.artifacts)));
    const versioned = await prepareRmtJitKernelCache({ ...options, version: '0.8.1' });
    assert.notEqual(versioned.key, cold.key);
    const dead = spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' });
    assert.equal(dead.status, 0);
    fs.writeFileSync(path.join(cacheDir, cold.key + '.json'), '{}');
    fs.writeFileSync(path.join(cacheDir, cold.key + '.json.lock'), JSON.stringify({ pid: dead.pid }), { mode: 0o600 });
    assert.equal((await prepareRmtJitKernelCache(options)).architectureChecks, 1);
    console.log('passed shared assembly parity and disk cache reuse');
    const file = path.join(fixtureRoot, 'xtendrmt/kernel/templates/rmt-browser-preamble.js');
    const original = fs.readFileSync(file); const stat = fs.statSync(file);
    fs.appendFileSync(file, '\n// changed with preserved timestamps\n'); fs.utimesSync(file, stat.atime, stat.mtime);
    const changed = await prepareRmtJitKernelCache(options);
    assert.notEqual(changed.key, cold.key); assert.equal(changed.architectureChecks, 1);
    fs.writeFileSync(path.join(cacheDir, changed.key + '.json'), '{}');
    assert.equal((await prepareRmtJitKernelCache(options)).cacheStatus, 'miss');
    const manifestPath = path.join(fixtureRoot, 'xtendrmt/kernel/rmt-kernel-sources.json');
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    fs.writeFileSync(manifestPath, manifest.replace('"strict": true', '"strict": false'));
    await assert.rejects(prepareRmtJitKernelCache(options), /strict MVC/);
    fs.writeFileSync(manifestPath, manifest);
    fs.unlinkSync(manifestPath);
    await assert.rejects(prepareRmtJitKernelCache(options));
    fs.writeFileSync(manifestPath, manifest);
    fs.unlinkSync(file);
    await assert.rejects(prepareRmtJitKernelCache(options));
    fs.writeFileSync(file, original);
    console.log('passed source invalidation, corruption and fail-closed validation after cache hits');
    fs.chmodSync(cacheDir, 0o500);
    // A different fingerprint forces publication rather than a read-only hit.
    fs.appendFileSync(file, '\n// read-only cache\n');
    const unavailable = await prepareRmtJitKernelCache(options);
    assert.equal(unavailable.cacheStatus, 'unavailable'); assert.equal(unavailable.artifacts['xtendrmt/rmt-manifest.json'].ok, true);
    fs.chmodSync(cacheDir, 0o700);
    fs.appendFileSync(file, '\n// parallel generation\n');
    const script = `require(${JSON.stringify(path.join(rootDir, 'tools/rmt-jit-kernel-cache.js'))}).prepareRmtJitKernelCache(${JSON.stringify(options)}).then(r=>console.log(JSON.stringify({key:r.key,checks:r.architectureChecks}))).catch(e=>{console.error(e);process.exitCode=1})`;
    const fork = () => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['-e', script]); let out = '', err = '';
      child.stdout.on('data', data => out += data); child.stderr.on('data', data => err += data);
      child.on('error', reject); child.on('close', code => code ? reject(new Error(err)) : resolve(JSON.parse(out)));
    });
    const concurrent = await Promise.all([fork(), fork(), fork()]);
    assert.equal(new Set(concurrent.map(entry => entry.key)).size, 1);
    assert.equal(concurrent.reduce((sum, entry) => sum + entry.checks, 0), 1);
    console.log('passed read-only fallback and one assembly across competing processes');
    const session = createRmtCompilationSession({ root: rootDir, applyDefaultDocumentId: false, readonlyResults: true });
    const input = { text: fixtures[0].source, filePath: 'inline.rmt' };
    const first = session.compileSource(input, { documentId: 'one', source: 'test' });
    assert.strictEqual(first, session.compileSource(input, { source: 'test', documentId: 'one' }));
    const second = session.compileSource(input, { documentId: 'two', source: 'test' });
    assert.notStrictEqual(first, second);
    assert.throws(() => { first.coreDocument.manifest.documentId = 'mutated'; }, TypeError);
    assert.deepStrictEqual(session.snapshot(), { compilations: 2, hits: 1, documents: 2 });
    session.dispose(); assert.equal(session.snapshot().documents, 0);
    console.log('passed option isolation, immutable facts and session cleanup');
  } finally { fs.chmodSync(cacheDir, 0o700); if (fs.rmSync) fs.rmSync(directory, { recursive: true }); else fs.rmdirSync(directory, { recursive: true }); }
}
main().catch(error => { console.error(error.message, error.stack); process.exitCode = 1; });
