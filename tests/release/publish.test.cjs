'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { packedFixture, registryFixture } = require('./fixtures.cjs');
const { channelTag, promotionSupported, publishRelease } = require('../../scripts/release/publish.cjs');
const { parseRegistryResult, parseHttpRegistryResult, npmAdapters } = require('../../scripts/release/npm.cjs');
const { assertPublishInput } = require('../../scripts/release/cli.cjs');
async function setup(t) {
  const f = await packedFixture(t), r = registryFixture(f.artifact);
  return { f, r, run: options => publishRelease({ artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, ...options }) };
}
test('stable and prerelease channels remain separate including future 1.x minors', () => {
  assert.equal(channelTag('1.7.0'), 'latest'); assert.equal(channelTag('1.8.0-rc.1'), 'next');
  assert.equal(channelTag('1.8.0-beta.1', 'beta'), 'beta'); assert.throws(() => channelTag('1.8.0-rc.1', 'latest'));
});
test('OIDC promotion is optional and blocked on npm 11.17 or missing dist-tag permission', () => {
  assert.throws(() => promotionSupported('11.17.0', true), /11.21/);
  assert.throws(() => promotionSupported('11.21.0', false), /permission/);
  assert.throws(() => promotionSupported('12.1.0', true)); promotionSupported('11.21.0', true); promotionSupported('12.2.0', true);
});
test('missing input, fork, wrong workflow and wrong environment cannot activate publishing', () => {
  const good = { XTEND_RELEASE_PUBLISH: 'true', GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'konnilabs/xtend',
    GITHUB_WORKFLOW_REF: 'konnilabs/xtend/.github/workflows/xtend-default-gates.yml@refs/heads/main',
    XTEND_RELEASE_ENVIRONMENT: 'npm-publish', ACTIONS_ID_TOKEN_REQUEST_URL: 'set', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'set',
    XTEND_RELEASE_GATES_VERIFIED: 'true' };
  assertPublishInput(good);
  for (const [key, value] of [['XTEND_RELEASE_PUBLISH', 'false'], ['GITHUB_REPOSITORY', 'fork/xtend'],
    ['GITHUB_WORKFLOW_REF', 'konnilabs/xtend/.github/workflows/other.yml@refs/heads/main'],
    ['XTEND_RELEASE_ENVIRONMENT', 'other'], ['XTEND_RELEASE_GATES_VERIFIED', 'false']]) assert.throws(() => assertPublishInput({ ...good, [key]: value }));
});
test('only structured definitive 404 means absent; network/auth/rate-limit/server/malformed errors stop', () => {
  assert.equal(parseRegistryResult({ status: 1, stdout: JSON.stringify({ error: { code: 'E404', summary: '404 Not Found - GET https://registry.npmjs.org/example' } }) }), null);
  for (const code of ['E401', 'E403', 'E429', 'E500', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'])
    assert.throws(() => parseRegistryResult({ status: 1, stdout: JSON.stringify({ error: { code, summary: 'error' } }) }));
  for (const result of [{ status: 1, stdout: 'E404' }, { status: 1, stdout: '{}' }, { status: 0, stdout: 'null' },
    { status: 0, stdout: '' }, { status: 0, stdout: '[]' }, { status: 1, timedOut: true, stdout: '{"error":{"code":"E404","summary":"404 Not Found"}}' }])
    assert.throws(() => parseRegistryResult(result));
});
test('registry adapter uses exact version and fixed public registry provenance endpoint', async () => {
  const seen = [], entry = { name: '@ccslabs/xtend', version: '1.0.0' };
  const a = npmAdapters({ registryRequest: async url => { seen.push(url); return { name: entry.name, version: entry.version, versions: {} }; } });
  await a.registry.package(entry); await a.registry.version(entry);
  assert.deepEqual(seen, ['https://registry.npmjs.org/%40ccslabs%2Fxtend', 'https://registry.npmjs.org/%40ccslabs%2Fxtend/1.0.0']);
});
test('real HTTP 404 is distinguished from all transport/auth/rate-limit/redirect/server failures', () => {
  assert.equal(parseHttpRegistryResult({ transportOk: true, status: 404, body: '{"error":"Not found"}' }), null);
  assert.equal(parseHttpRegistryResult({ transportOk: true, status: 404, body: '"version not found: 9999.0.0"', expectedVersion: '9999.0.0' }), null);
  assert.throws(() => parseHttpRegistryResult({ transportOk: true, status: 404, body: '"version not found: other"', expectedVersion: '9999.0.0' }));
  for (const status of [0, 301, 302, 401, 403, 429, 500, 502, 503])
    assert.throws(() => parseHttpRegistryResult({ transportOk: true, status, body: '{"error":"Not found"}' }));
  assert.throws(() => parseHttpRegistryResult({ transportOk: false, status: 404, body: '{"error":"Not found"}' }));
  assert.throws(() => parseHttpRegistryResult({ transportOk: true, status: 404, body: 'proxy error' }));
});
test('npm publisher receives only a sealed copy of the checked tarball with explicit tag/public/provenance and lifecycle scripts disabled', async t => {
  const { f } = await setup(t), entry = f.artifact.packages[0]; let sealed;
  const adapters = npmAdapters({ publishCommand: async (cli, args, cwd) => {
    sealed = args[1]; assert.equal(args[0], 'publish'); assert.ok(sealed.endsWith('.tgz'));
    assert.notEqual(sealed, entry.absoluteFile); assert.equal(path.dirname(sealed), cwd);
    assert.deepEqual(fs.readFileSync(sealed), fs.readFileSync(entry.absoluteFile));
    for (const flag of ['--ignore-scripts', '--access=public', '--provenance', '--tag=latest']) assert.ok(args.includes(flag));
    assert.ok(!args.some(arg => /--workspace/.test(arg))); return { status: 0 };
  } });
  await adapters.publisher.publish(entry, 'latest'); assert.ok(!fs.existsSync(sealed));
});
test('default is read-only, with an always-on pending ledger and complete preflight', async t => {
  const { f, r, run } = await setup(t), ledger = await run({});
  assert.equal(ledger.status, 'dry-run'); assert.ok(ledger.packages.every(p => p.state === 'pending'));
  assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0); assert.equal(JSON.parse(fs.readFileSync(f.ledgerFile)).packages.length, 10);
});
test('npm 11.17 direct standard path publishes ten exact archives sequentially with explicit latest and no tag command', async t => {
  const { f, r, run } = await setup(t), ledger = await run({ publish: true });
  assert.equal(ledger.status, 'complete'); assert.ok(ledger.packages.every(p => p.state === 'published' && p.tagState === 'verified'));
  const uploads = r.calls.filter(c => c[0] === 'publish'); assert.deepEqual(uploads.map(c => c[1]), f.artifact.order);
  assert.ok(uploads.every(c => c[2] === 'latest')); assert.equal(r.calls.filter(c => c[0] === 'tag').length, 0);
  assert.equal(r.calls.slice(0, r.calls.findIndex(c => c[0] === 'publish')).filter(c => c[0] === 'version').length, 11);
});
test('direct prerelease uploads use next with npm 11.17, never latest', async t => {
  const { f, r, run } = await setup(t);
  f.artifact.packages.forEach(entry => { entry.version += '-rc.1'; });
  assert.equal((await run({ publish: true })).status, 'complete');
  assert.ok(r.calls.filter(c => c[0] === 'publish').every(c => c[2] === 'next'));
});
test('identical existing versions skip; conflicting integrity prevents every upload', async t => {
  const { f, r, run } = await setup(t);
  r.installed(f.artifact.packages[0], 'latest'); assert.equal((await run({ publish: true })).packages[0].state, 'verified-existing');
  r.calls.length = 0; r.versions.get(f.artifact.packages[0].name).dist.integrity = 'different';
  await assert.rejects(run({ publish: true }), /conflict/); assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0);
});
test('postpublish provenance binds both actual tarball digest and source SHA', async t => {
  const { f, r, run } = await setup(t); r.installed(f.artifact.packages[0], 'latest');
  r.versions.get(f.artifact.packages[0].name).provenanceStatements[0].predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = 'b'.repeat(40);
  await assert.rejects(run({ publish: true }), /Provenance source/);
});
test('timeout after successful upload checks registry and skips retry', async t => {
  const { r, run } = await setup(t), original = r.publisher.publish;
  let count = 0; r.publisher.publish = async (...args) => { await original(...args); if (++count === 1) throw Object.assign(Error('timeout'), { retryable: true }); };
  assert.equal((await run({ publish: true })).status, 'complete'); assert.equal(count, 10);
});
test('timeout before upload retries only after exact 404 and rechecks latest', async t => {
  const { r, run } = await setup(t), original = r.publisher.publish;
  let count = 0; r.publisher.publish = async (...args) => { if (++count === 1) throw Object.assign(Error('timeout'), { retryable: true }); return original(...args); };
  assert.equal((await run({ publish: true })).status, 'complete'); assert.equal(count, 11);
});
test('registry failure after timeout prevents retry and preserves failed/pending ledger', async t => {
  const { f, r, run } = await setup(t), original = r.registry.version; let uncertain = false, attempts = 0;
  r.publisher.publish = async () => { attempts++; uncertain = true; throw Object.assign(Error('timeout'), { retryable: true }); };
  r.registry.version = async entry => { if (uncertain) throw Error('E429'); return original(entry); };
  await assert.rejects(run({ publish: true }), /E429/); assert.equal(attempts, 1);
  const ledger = JSON.parse(fs.readFileSync(f.ledgerFile)); assert.equal(ledger.packages[0].state, 'failed');
  assert.ok(ledger.packages.slice(1).every(p => p.state === 'pending'));
});
test('partial direct release resumes from same immutable artifact without rebuilding or republishing', async t => {
  const { f, r, run } = await setup(t), original = r.publisher.publish; let count = 0;
  r.publisher.publish = async (...args) => { if (++count === 3) throw Error('permission'); return original(...args); };
  await assert.rejects(run({ publish: true }), /Publish failed/);
  const partial = JSON.parse(fs.readFileSync(f.ledgerFile)); assert.deepEqual(partial.packages.slice(0, 3).map(p => p.state), ['published', 'published', 'failed']);
  r.publisher.publish = original; r.calls.length = 0;
  const ledger = await run({ publish: true }); assert.equal(ledger.status, 'complete');
  assert.deepEqual(ledger.packages.slice(0, 2).map(p => p.state), ['verified-existing', 'verified-existing']);
  assert.equal(r.calls.filter(c => c[0] === 'publish').length, 8);
});
test('resume refuses a different artifact even with identical versions', async t => {
  const { f, run } = await setup(t); await run({}); const before = fs.readFileSync(f.ledgerFile); f.artifact.manifestIntegrity = 'other';
  await assert.rejects(run({ publish: true }), /another immutable artifact/);
  assert.deepEqual(fs.readFileSync(f.ledgerFile), before);
});
test('missing package requires explicit bootstrap ownership plan', async t => {
  const { f, r, run } = await setup(t); r.packages.delete(f.artifact.packages[0].name);
  await assert.rejects(run({ publish: true }), /ownership\/bootstrap/); assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0);
});
test('stale latest or a higher published stable version blocks before any upload', async t => {
  const { f, r, run } = await setup(t), pack = r.packages.get(f.artifact.packages.at(-1).name);
  pack.versions = ['1.0.0']; await assert.rejects(run({ publish: true }), /Stale stable/);
  pack.versions = []; pack['dist-tags'].latest = '1.0.0'; await assert.rejects(run({ publish: true }), /Stale latest/);
  assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0);
});
test('latest advancing after preflight blocks direct upload; resume preserves newer latest for identical existing bytes', async t => {
  const { f, r, run } = await setup(t), original = r.registry.version; let calls = 0;
  r.registry.version = async entry => { if (++calls === 11) r.packages.get(entry.name)['dist-tags'].latest = '1.0.0'; return original(entry); };
  await assert.rejects(run({ publish: true }), /Stale latest/);
  r.registry.version = original; r.installed(f.artifact.packages[0], 'latest');
  r.packages.get(f.artifact.packages[0].name)['dist-tags'].latest = '1.0.0';
  assert.equal((await run({ publish: true })).packages[0].tagState, 'preserved-newer');
  assert.equal(r.packages.get(f.artifact.packages[0].name)['dist-tags'].latest, '1.0.0');
});
test('existing version with missing/older tag reports explicit repair; never republishes on npm 11.17', async t => {
  const { f, r, run } = await setup(t); r.installed(f.artifact.packages[0], 'latest');
  delete r.packages.get(f.artifact.packages[0].name)['dist-tags'].latest;
  const ledger = await run({ publish: true }); assert.equal(ledger.status, 'tag-repair-required');
  assert.equal(ledger.packages[0].state, 'verified-existing'); assert.equal(r.calls.filter(c => c[0] === 'tag').length, 0);
});
test('artifact tamper after preflight stops before upload', async t => {
  const { f, r, run } = await setup(t), original = r.registry.version; let calls = 0;
  r.registry.version = async entry => { if (++calls === 11) fs.appendFileSync(entry.absoluteFile, 'tamper'); return original(entry); };
  await assert.rejects(run({ publish: true }), /Artifact changed/); assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0);
});
test('parallel releases share a lock and cannot cancel or overwrite the active ledger', async t => {
  const { f, r, run } = await setup(t), original = r.registry.version; let release, entered;
  const barrier = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { entered = resolve; });
  r.registry.version = async entry => { entered(); await barrier; return original(entry); };
  const first = run({}); await started;
  await assert.rejects(run({}), /EEXIST/); assert.ok(fs.existsSync(path.join(path.dirname(f.ledgerFile), 'npm-release.lock')));
  release(); await first;
});
test('optional staged promotion checks capability before every upload and does not affect direct standard path', async t => {
  const { r, run } = await setup(t);
  await assert.rejects(run({ publish: true, staged: true, promote: true }), /11.21/);
  assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0);
  const ledger = await run({ publish: true, staged: true, promote: true, npmVersion: '11.21.0', distTagsAuthorized: true });
  assert.equal(ledger.status, 'complete'); assert.equal(r.calls.filter(c => c[0] === 'tag').length, 10);
});
