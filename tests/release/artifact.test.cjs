'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const tar = require('tar');
const { packedFixture, write } = require('./fixtures.cjs');
const { digest, inspectTarball, checkEntrypoints } = require('../../scripts/release/artifact.cjs');
const { runConsumers } = require('../../scripts/release/consumer.cjs');
test('ten real fixture .tgz files verify size/SHA-512, source, toolchain, edges, files and bound canary', async t => {
  const f = await packedFixture(t); assert.equal(f.artifact.packages.length, 10);
  assert.ok(f.artifact.packages.every(p => p.files.every(file => file.integrity.startsWith('sha512-'))));
  const result = await runConsumers({ artifact: f.artifact, rootDir: f.rootDir });
  assert.equal(result.mode, 'dry-run'); assert.equal(result.packages.length, 10);
});
for (const mutation of ['tarball-bytes', 'manifest-bytes', 'size', 'version', 'source', 'toolchain', 'edges', 'omitted', 'duplicate', 'files', 'metadata', 'build-evidence', 'canary-bytes', 'canary-binding', 'canary-incomplete', 'canary-runtime', 'canary-mcp', 'symlink']) {
  test(`artifact rejects ${mutation}`, async t => {
    const f = await packedFixture(t), m = f.manifest, originalHash = f.integrity();
    if (mutation === 'tarball-bytes') fs.appendFileSync(path.join(f.artifactDir, m.packages[0].file), 'tamper');
    if (mutation === 'manifest-bytes') fs.appendFileSync(path.join(f.artifactDir, 'release-manifest.json'), ' ');
    if (mutation === 'size') m.packages[0].size++;
    if (mutation === 'version') m.packages[0].version = '1.0.0';
    if (mutation === 'source') m.sourceSha = 'b'.repeat(40);
    if (mutation === 'toolchain') m.toolchain.npm = '11.21.0';
    if (mutation === 'edges') m.edges[0].hard = true;
    if (mutation === 'omitted') m.packages.pop();
    if (mutation === 'duplicate') m.packages[1] = m.packages[0];
    if (mutation === 'files') m.packages[0].files.pop();
    if (mutation === 'metadata') f.mutate('xtendrmt', p => { p.main = './missing.cjs'; });
    if (mutation === 'build-evidence') fs.appendFileSync(path.join(f.artifactDir, 'build.json'), 'tamper');
    if (mutation === 'canary-bytes') fs.appendFileSync(path.join(f.artifactDir, 'canary.json'), ' ');
    if (mutation.startsWith('canary-') && mutation !== 'canary-bytes') {
      if (mutation === 'canary-binding') f.canary.tarballSetIntegrity = digest('other');
      if (mutation === 'canary-incomplete') f.canary.packages[0].types = false;
      if (mutation === 'canary-runtime') f.canary.runtimeImports = false;
      if (mutation === 'canary-mcp') f.canary.mcpKnowledgeGenerated = false;
      write(path.join(f.artifactDir, 'canary.json'), f.canary);
      m.canary.integrity = digest(fs.readFileSync(path.join(f.artifactDir, 'canary.json')));
    }
    if (mutation === 'symlink') {
      const old = path.join(f.artifactDir, m.packages[0].file), outside = path.join(f.directory, 'outside.tgz');
      fs.renameSync(old, outside); fs.symlinkSync(outside, old);
    }
    if (mutation !== 'manifest-bytes') f.reseal();
    await assert.rejects(f.verify(mutation === 'manifest-bytes' ? { manifestIntegrity: originalHash } : {}));
  });
}
test('archive links are rejected without extraction', async t => {
  const f = await packedFixture(t), dir = path.join(f.directory, 'malicious'); fs.mkdirSync(path.join(dir, 'package'), { recursive: true });
  fs.symlinkSync('/etc/passwd', path.join(dir, 'package/link'));
  const file = path.join(f.directory, 'link.tgz'); await tar.c({ cwd: dir, file, gzip: true }, ['package']);
  await assert.rejects(inspectTarball(file), /links\/special/);
});
test('missing export, wildcard, bin and declaration targets fail', () => {
  const files = [{ path: 'package.json' }, { path: 'README.md' }];
  for (const manifest of [{ exports: './missing.js' }, { exports: { './x/*': './x/*.js' } }, { bin: { cli: './missing' } }, { types: './missing.d.ts' }])
    assert.throws(() => checkEntrypoints(manifest, files), /Missing/);
});
test('real clean consumer installs all ten miniature tarballs offline, imports them and compiles declarations', async t => {
  const f = await packedFixture(t);
  fs.symlinkSync(path.join(__dirname, '../../node_modules'), path.join(f.rootDir, 'node_modules'), 'dir');
  const script = path.join(f.rootDir, 'products/xtend-mcp/scripts/build-knowledge.mjs');
  fs.mkdirSync(path.dirname(script), { recursive: true }); fs.writeFileSync(script, '// Fixture knowledge check exits successfully.\n');
  const npmCli = process.env.XTEND_RELEASE_TEST_NPM_CLI || process.env.npm_execpath;
  assert.ok(npmCli, 'Run via npm run test:release-safety:unit or set XTEND_RELEASE_TEST_NPM_CLI to the pinned npm CLI');
  const report = await runConsumers({ artifact: f.artifact, rootDir: f.rootDir, npmCli,
    outputFile: path.join(f.directory, 'consumer-report.json'), executeCanary: true, offline: true });
  assert.equal(report.ok, true); assert.equal(report.runtimeImports, true); assert.equal(report.packages.length, 10);
  assert.ok(report.packages.every(entry => entry.types && entry.files));
});
