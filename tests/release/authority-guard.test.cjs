'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { packedFixture, registryFixture } = require('./fixtures.cjs');
const production = require('../../scripts/release/publish.cjs');
const { loadPublisher } = require('./authority-fixture.cjs');
const root = path.resolve(__dirname, '../..');
for (const resume of [false, true]) test(`actual publisher rejects active initial authority before registry/upload, resume=${resume}`, async t => {
  const f = await packedFixture(t);
  if (resume) {
    fs.mkdirSync(path.dirname(f.ledgerFile), { recursive: true });
    fs.writeFileSync(f.ledgerFile, JSON.stringify({ schema: ['xtend','release','ledger','v1'].join('.'),
      sourceSha: f.sourceSha, manifestIntegrity: f.artifact.manifestIntegrity }));
  }
  let calls = 0;
  const forbidden = () => { calls++; throw Error('Registry/publisher backend must not be reached'); };
  await assert.rejects(production.publishRelease({ artifact: f.artifact, ledgerFile: f.ledgerFile, publish: true,
    registry: { version: forbidden, package: forbidden }, publisher: { publish: forbidden, dryRun: forbidden, tag: forbidden } }), /source-level initial-authority retirement/);
  assert.equal(calls, 0);
  const ledger = JSON.parse(fs.readFileSync(f.ledgerFile));
  assert.equal(ledger.status, 'failed'); assert.match(ledger.error, /source-level/);
  assert(ledger.packages.every(entry => entry.state === 'pending' && !entry.uploadAttempted));
  assert.equal(fs.existsSync(path.join(path.dirname(f.ledgerFile), 'npm-release.lock')), false);
});
test('production read-only preflight remains available while actual first release is blocked', async t => {
  const f = await packedFixture(t), r = registryFixture(f.artifact);
  const ledger = await production.publishRelease({ artifact: f.artifact, ...r, ledgerFile: f.ledgerFile });
  assert.equal(ledger.status, 'dry-run'); assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
});
for (const scope of [['--groups','mcp'], ['--groups','material'], ['--packages','@ccslabs/xtend']]) {
  test(`actual clean-shell explicit first-release CLI rejects before artifact/toolchain: ${scope.join(' ')}`, () => {
    const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; delete env.npm_execpath; delete env.XTEND_NPM_CLI;
    const result = spawnSync(process.execPath, ['scripts/release/cli.cjs', 'publish', '--execute', ...scope],
      { cwd: root, env, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 1, result.stderr); assert.match(result.stderr, /source-level initial-authority retirement/);
    assert.doesNotMatch(result.stderr, /Artifact|npm CLI|Publish requires/);
  });
}
test('temporary source-retired fixture reaches direct sequential mock publisher, production source remains enabled', async t => {
  const f = await packedFixture(t), r = registryFixture(f.artifact);
  const result = await loadPublisher().publishRelease({ artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true });
  assert.equal(result.status, 'complete'); assert.equal(r.calls.filter(call => call[0] === 'publish').length, 10);
  assert.throws(() => require('../../scripts/scan_schema_inventory').assertCandidateInitialAuthorityRetiredForRelease(), /source-level/);
});
test('public scanner API and portable ci-publish execute/verify guard remain canonical', () => {
  const api = require('../../tools/schema-inventory/index.cjs').createScanner({ typescript: require('typescript'), defaultRootDir: root });
  assert.equal(typeof api.scanSchemaInventory, 'function'); assert.equal(typeof api.validateInventoryDocument, 'function');
  const cli = fs.readFileSync(path.join(root, 'scripts/test-runner/cli.js'), 'utf8');
  assert.match(cli, /options\.profile === 'ci-publish' \|\| options\.verify === 'ci-publish'/);
  assert.match(cli, /assertCandidateInitialAuthorityRetiredForRelease\(\)/);
});
