'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { packedFixture, registryFixture } = require('./fixtures.cjs');
const { channelTag, promotionSupported, publishRelease, sourceRepository } = require('./authority-fixture.cjs').loadPublisher();
const { parseRegistryResult, parseHttpRegistryResult, npmAdapters } = require('../../scripts/release/npm.cjs');
const { assertPublishInput } = require('../../scripts/release/cli.cjs');
async function setup(t) {
  const f = await packedFixture(t), r = registryFixture(f.artifact);
  return { f, r, run: options => publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, ...options }) };
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
    GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'workflow_dispatch',
    XTEND_RELEASE_NEEDS: JSON.stringify(Object.fromEntries([...require('../../scripts/release/github.cjs').gates, 'release-seal'].map(name => [name, { result: 'success' }]))) };
  good.XTEND_RELEASE_ARTIFACT_ID='123';const needs=JSON.parse(good.XTEND_RELEASE_NEEDS);needs['release-seal'].outputs={artifactId:'123'};good.XTEND_RELEASE_NEEDS=JSON.stringify(needs);
  assertPublishInput(good);
  for (const [key, value] of [['XTEND_RELEASE_PUBLISH', 'false'], ['GITHUB_REPOSITORY', 'fork/xtend'],
    ['GITHUB_WORKFLOW_REF', 'konnilabs/xtend/.github/workflows/other.yml@refs/heads/main'],
    ['XTEND_RELEASE_ENVIRONMENT', 'other'], ['GITHUB_REF', 'refs/tags/v1.0.0'], ['GITHUB_EVENT_NAME', 'push'],
    ['XTEND_RELEASE_NEEDS', '{}'], ['XTEND_RELEASE_ARTIFACT_ID', ''], ['XTEND_RELEASE_ARTIFACT_ID', '999']]) assert.throws(() => assertPublishInput({ ...good, [key]: value }));
  const missingSealId=JSON.parse(good.XTEND_RELEASE_NEEDS);delete missingSealId['release-seal'].outputs.artifactId;
  assert.throws(()=>assertPublishInput({...good,XTEND_RELEASE_NEEDS:JSON.stringify(missingSealId)}));
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
test('all pending tarball publish dry-runs pass before the first upload; verified-existing versions are skipped', async t => {
  const { f, r, run } = await setup(t); r.installed(f.artifact.packages[0], 'latest');
  const dryRuns = [], original = r.publisher.publish;
  r.publisher.dryRun = async (entry, tag) => { assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0); dryRuns.push([entry.name, tag]); };
  r.publisher.publish = async (...args) => { assert.equal(dryRuns.length, 9); return original(...args); };
  const ledger = await run({ publish: true });
  assert.deepEqual(dryRuns.map(item => item[0]), f.artifact.order.slice(1));
  assert.ok(dryRuns.every(item => item[1] === 'latest'));
  assert.equal(ledger.packages.filter(item => item.publishDryRun === 'passed').length, 9);
});
test('a failed tarball dry-run blocks all uploads and keeps a failed/pending result ledger', async t => {
  const { f, r, run } = await setup(t); let calls = 0;
  r.publisher.dryRun = async () => { if (++calls === 2) throw Error('dry-run rejected'); };
  await assert.rejects(run({ publish: true }), /dry-run rejected/);
  assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0);
  const ledger = JSON.parse(fs.readFileSync(f.ledgerFile));
  assert.equal(ledger.status, 'failed'); assert.equal(ledger.packages[1].state, 'failed');
  assert.ok(ledger.packages.slice(2).every(item => item.state === 'pending'));
});
test('default read-only preflight never invokes the tarball publish dry-run adapter', async t => {
  const { r, run } = await setup(t);
  r.publisher.dryRun = async () => { throw Error('must not invoke npm publish in read-only mode'); };
  assert.equal((await run({})).status, 'dry-run');
});
test('npm dry-run uses the same sealed bytes and flags with --dry-run; errors stop without retry', async t => {
  const { f } = await setup(t), entry = f.artifact.packages[0]; let sealed, count = 0;
  const { publisher } = npmAdapters({ publishCommand: async (_cli, args) => {
    count++; sealed = args[1]; assert.deepEqual(fs.readFileSync(sealed), fs.readFileSync(entry.absoluteFile));
    for (const flag of ['--dry-run', '--ignore-scripts', '--access=public', '--provenance', '--tag=next']) assert.ok(args.includes(flag));
    return { status: 1, timedOut: true };
  } });
  await assert.rejects(publisher.dryRun(entry, 'next'), error => /dry-run gate/.test(error.message) && error.retryable === false);
  assert.equal(count, 1); assert.equal(fs.existsSync(sealed), false);
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
test('timeout with exact 404 remains pending without retrying upload', async t => {
  const { r, run } = await setup(t), original = r.publisher.publish;
  let count = 0; r.publisher.publish = async (...args) => { if (++count === 1) throw Object.assign(Error('timeout'), { retryable: true }); return original(...args); };
  assert.equal((await run({ publish: true })).status, 'pending-verification'); assert.equal(count, 1);
  assert.equal((await run({ publish: true })).status, 'pending-verification'); assert.equal(count, 1);
});
test('registry failure after timeout prevents retry and preserves pending-verification ledger', async t => {
  const { f, r, run } = await setup(t), original = r.registry.version; let uncertain = false, attempts = 0;
  r.publisher.publish = async () => { attempts++; uncertain = true; throw Object.assign(Error('timeout'), { retryable: true }); };
  r.registry.version = async entry => { if (uncertain) throw Error('E429'); return original(entry); };
  assert.equal((await run({ publish: true })).status, 'pending-verification'); assert.equal(attempts, 1);
  const ledger = JSON.parse(fs.readFileSync(f.ledgerFile)); assert.equal(ledger.packages[0].state, 'pending-verification');
  assert.ok(ledger.packages.slice(1).every(p => p.state === 'pending'));
});
test('partial direct release resumes from same immutable artifact without rebuilding or republishing', async t => {
  const { f, r, run } = await setup(t), original = r.publisher.publish; let count = 0;
  r.publisher.publish = async (...args) => { if (++count === 3) throw Error('permission'); return original(...args); };
  assert.equal((await run({ publish: true })).status, 'pending-verification');
  const partial = JSON.parse(fs.readFileSync(f.ledgerFile)); assert.deepEqual(partial.packages.slice(0, 3).map(p => p.state), ['published', 'published', 'pending-verification']);
  r.installed(f.artifact.packages[2], 'latest');
  r.publisher.publish = original; r.calls.length = 0;
  const ledger = await run({ publish: true }); assert.equal(ledger.status, 'complete');
  assert.deepEqual(ledger.packages.slice(0, 2).map(p => p.state), ['verified-existing', 'verified-existing']);
  assert.equal(r.calls.filter(c => c[0] === 'publish').length, 7);
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
  pack.versions = ['1.0.0']; pack['dist-tags'].latest = '1.0.0'; await assert.rejects(run({ publish: true }), /Stale latest/);
  assert.equal(r.calls.filter(c => c[0] === 'publish').length, 0);
});
test('latest advancing after preflight blocks direct upload; resume preserves newer latest for identical existing bytes', async t => {
  const { f, r, run } = await setup(t), original = r.registry.version; let calls = 0;
  r.registry.version = async entry => { if (++calls === 11) { r.packages.get(entry.name)['dist-tags'].latest = '1.0.0'; r.packages.get(entry.name).versions.push('1.0.0'); } return original(entry); };
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
test('provenance accepts exact normalized GitHub source identities only', () => {
  for (const uri of ['https://github.com/konnilabs/xtend', 'git+https://github.com/konnilabs/xtend.git',
    'git+https://github.com/konnilabs/xtend@refs/heads/main', 'https://github.com/konnilabs/xtend.git#refs/tags/v1.2.0']) {
    assert.equal(sourceRepository(uri), 'https://github.com/konnilabs/xtend');
  }
});
for (const uri of ['https://evilgithub.com/konnilabs/xtend', 'https://github.com.evil.test/konnilabs/xtend',
  'https://github.com@evil.test/konnilabs/xtend', 'https://user:password@github.com/konnilabs/xtend',
  'https://github.com:443/konnilabs/xtend', 'https://github.com:8080/konnilabs/xtend',
  'https://github.com/konnilabs/xtend/evil', 'https://github.com/konnilabs/xtend.git/evil',
  'https://github.com/konnilabs/xtend-other', 'https://github.com/evil/xtend',
  'https://github.com/konnilabs/evil/../xtend', 'https://github.com/konnilabs/%78tend',
  'http://github.com/konnilabs/xtend', 'https://github.com/konnilabs/xtend?repository=evil']) {
  test(`provenance rejects source ${uri}`, async t => {
    const { f, r, run } = await setup(t); r.installed(f.artifact.packages[0], 'latest');
    r.versions.get(f.artifact.packages[0].name).provenanceStatements[0].predicate.buildDefinition.resolvedDependencies[0].uri = uri;
    await assert.rejects(run({ publish: true }), /Provenance source/);
    assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
  });
}
const malformedPackuments = [null, {}, { name: 'wrong', versions: [], 'dist-tags': {} },
  { versions: [], 'dist-tags': {} }, { versions: '0.9.0', 'dist-tags': {} },
  { versions: [], 'dist-tags': [] }, { versions: [], 'dist-tags': { latest: 'garbage' } },
  { versions: ['0.9.0', '0.9.0'], 'dist-tags': {} }];
for (const [index, malformed] of malformedPackuments.entries()) {
  test(`existing exact version rejects malformed packument ${index} before any next upload`, async t => {
    const { f, r, run } = await setup(t), entry = f.artifact.packages[0]; r.installed(entry, 'latest');
    r.packages.set(entry.name, malformed && { name: entry.name, ...structuredClone(malformed) });
    await assert.rejects(run({ publish: true }), /Invalid registry metadata|Inconsistent registry version presence/);
    assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
  });
}
test('existing version packument disappearing after complete preflight stops before later upload', async t => {
  const { f, r, run } = await setup(t), entry = f.artifact.packages[0]; r.installed(entry, 'latest');
  const original = r.registry.package; let count = 0;
  r.registry.package = async value => value.name === entry.name && ++count === 2 ? null : original(value);
  await assert.rejects(run({ publish: true }), /Invalid registry metadata/);
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
});
for (const [index, malformed] of malformedPackuments.entries()) if (malformed !== null && index !== 3) {
  test(`pending exact version rejects malformed packument ${index} before first upload`, async t => {
    const { f, r, run } = await setup(t), entry = f.artifact.packages[0];
    r.packages.set(entry.name, { name: entry.name, ...structuredClone(malformed) });
    await assert.rejects(run({ publish: true }), /Invalid registry metadata/);
    assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
  });
}
test('postupload exact version with missing packument remains pending and retains partial ledger', async t => {
  const { f, r, run } = await setup(t), original = r.publisher.publish;
  r.publisher.publish = async (entry, tag) => { await original(entry, tag); r.packages.delete(entry.name); };
  assert.equal((await run({ publish: true })).status, 'pending-verification');
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 1);
  const ledger = JSON.parse(fs.readFileSync(f.ledgerFile));
  assert.equal(ledger.packages[0].state, 'pending-verification'); assert.ok(ledger.packages.slice(1).every(entry => entry.state === 'pending'));
});
test('exact-version presence must agree with validated packument for pending and existing paths', async t => {
  const { f, r, run } = await setup(t), entry = f.artifact.packages[0];
  r.packages.get(entry.name).versions.push(entry.version);
  await assert.rejects(run({ publish: true }), /Inconsistent registry version presence/);
  r.installed(entry, 'latest'); r.packages.get(entry.name).versions = []; r.packages.get(entry.name)['dist-tags'] = {};
  await assert.rejects(run({ publish: true }), /Inconsistent registry version presence/);
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
});
for (const group of ['mcp', 'material']) {
  test(`${group}-only minor publishes selected archives with immutable older-source registry closure on npm 11.17`, async t => {
    const f = await packedFixture(t, { selection: { groups: [group] }, beforePack(fixture) {
      for (const entry of fixture.specification.packages.filter(item => item.group === group)) fixture.mutate(entry.path, manifest => {
        manifest.version = '1.2.0';
        if (entry.name === '@xtend-material/maraca-tailwind') manifest.dependencies['@xtend-material/core'] = '1.2.0';
      });
    } });
    const r = registryFixture(f.artifact);
    for (const entry of f.artifact.registryDependencies) r.installed(entry, 'latest');
    const coreTags = Object.fromEntries(f.artifact.registryDependencies.map(entry => [entry.name, structuredClone(r.packages.get(entry.name)['dist-tags'])]));
    const ledger = await publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true });
    assert.equal(ledger.status, 'complete'); assert.equal(f.artifact.inventory.packages.length, 10);
    assert.equal(f.artifact.packages.length, group === 'mcp' ? 1 : 2);
    assert.deepEqual(r.calls.filter(call => call[0] === 'publish').map(call => call[1]), f.artifact.order);
    assert.ok(ledger.registryDependencies.every(entry => entry.sourceSha === 'b'.repeat(40) && entry.sourceSha !== f.artifact.sourceSha && entry.state === 'verified-existing'));
    assert.deepEqual(Object.fromEntries(f.artifact.registryDependencies.map(entry => [entry.name, r.packages.get(entry.name)['dist-tags']])), coreTags);
    assert.equal(r.calls.filter(call => call[0] === 'tag').length, 0);
  });
}
for (const problem of ['absent', 'integrity', 'source', 'repository', 'metadata', 'packument']) {
  test(`registry dependency ${problem} blocks every selected upload`, async t => {
    const f = await packedFixture(t, { selection: { groups: ['mcp'] } }), r = registryFixture(f.artifact);
    for (const entry of f.artifact.registryDependencies) r.installed(entry, 'latest');
    const entry = f.artifact.registryDependencies[0], value = r.versions.get(entry.name);
    if (problem === 'absent') r.versions.delete(entry.name);
    if (problem === 'integrity') value.dist.integrity = 'wrong';
    if (problem === 'source') value.provenanceStatements[0].predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = f.artifact.sourceSha;
    if (problem === 'repository') value.repository.url = 'https://evilgithub.com/konnilabs/xtend';
    if (problem === 'metadata') value.dependencies = { '@ccslabs/xtend-cli': '0.9.0' };
    if (problem === 'packument') r.packages.delete(entry.name);
    await assert.rejects(publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true }));
    assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
  });
}
test('required registry dependency is reverified after preflight and before selected upload', async t => {
  const f = await packedFixture(t, { selection: { groups: ['material'] } }), r = registryFixture(f.artifact);
  const entry = f.artifact.registryDependencies[0]; r.installed(entry, 'latest');
  const original = r.registry.version; let count = 0;
  r.registry.version = async value => value.name === entry.name && ++count === 2 ? null : original(value);
  await assert.rejects(publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true }), /Required registry dependency absent/);
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
});
test('MCP-only partial release resumes from the same selected artifact and original dependency identities', async t => {
  const f = await packedFixture(t, { selection: { groups: ['mcp'] } }), r = registryFixture(f.artifact);
  for (const entry of f.artifact.registryDependencies) r.installed(entry, 'latest');
  const original = r.publisher.publish;
  r.publisher.publish = async () => { throw Error('permission'); };
  assert.equal((await publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true })).status, 'pending-verification');
  r.installed(f.artifact.packages[0], 'latest');
  r.publisher.publish = original;
  assert.equal((await publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true })).status, 'complete');
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
});
for (const group of ['mcp', 'material']) {
  test(`${group} registry closure is freshly verified immediately before every actual upload and visibility poll`, async t => {
    const f = await packedFixture(t, { selection: { groups: [group] } }), r = registryFixture(f.artifact);
    for (const dependency of f.artifact.registryDependencies) r.installed(dependency, 'latest');
    const expectedReads = f.artifact.registryDependencies.flatMap(dependency => [['version', dependency.name], ['package', dependency.name]]);
    const original = r.publisher.publish; let attempts = 0;
    r.publisher.publish = async (entry, tag) => {
      // Assert registry reads at the irreversible boundary, not only their count.
      assert.deepEqual(r.calls.slice(-expectedReads.length), expectedReads);
      if (++attempts === 1) {
        r.calls.push(['publish', entry.name, tag]);
        throw Object.assign(Error('timeout before upload'), { retryable: true });
      }
      await original(entry, tag);
    };
    const ledger = await publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true });
    assert.equal(ledger.status, 'pending-verification'); assert.equal(attempts, 1);
    assert.ok(r.calls.filter(call => call[0] === 'publish').every(call => call[2] === 'latest'));
    assert.equal(r.calls.filter(call => call[0] === 'tag').length, 0);
  });
}
const retryDependencyDrifts = {
  name: (r, dependency) => { r.versions.get(dependency.name).name = '@ccslabs/wrong'; },
  version: (r, dependency) => { r.versions.get(dependency.name).version = '9.9.9'; },
  integrity: (r, dependency) => { r.versions.get(dependency.name).dist.integrity = 'different'; },
  absent: (r, dependency) => { r.versions.delete(dependency.name); },
  source: (r, dependency) => { r.versions.get(dependency.name).provenanceStatements[0].predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = 'c'.repeat(40); },
  repository: (r, dependency) => { r.versions.get(dependency.name).repository.url = 'https://evilgithub.com/konnilabs/xtend'; },
  'missing-packument': (r, dependency) => { r.packages.delete(dependency.name); },
  'malformed-packument': (r, dependency) => { r.packages.set(dependency.name, {}); },
  'malformed-version': (r, dependency) => { r.versions.set(dependency.name, {}); },
  'version-timeout': (r, dependency) => {
    const original = r.registry.version;
    r.registry.version = async entry => { if (entry.name === dependency.name) throw Error('ETIMEDOUT'); return original(entry); };
  },
  'version-auth': (r, dependency) => {
    const original = r.registry.version;
    r.registry.version = async entry => { if (entry.name === dependency.name) throw Error('E403'); return original(entry); };
  },
  'version-rate-limit': (r, dependency) => {
    const original = r.registry.version;
    r.registry.version = async entry => { if (entry.name === dependency.name) throw Error('E429'); return original(entry); };
  },
  'packument-network': (r, dependency) => {
    const original = r.registry.package;
    r.registry.package = async entry => { if (entry.name === dependency.name) throw Error('ECONNRESET'); return original(entry); };
  }
};
for (const [problem, drift] of Object.entries(retryDependencyDrifts)) {
  test(`dependency ${problem} between timeout and retry stops before another upload`, async t => {
    const f = await packedFixture(t, { selection: { groups: ['mcp'] } }), r = registryFixture(f.artifact);
    for (const dependency of f.artifact.registryDependencies) r.installed(dependency, 'latest');
    const dependency = f.artifact.registryDependencies.at(-1), original = r.publisher.publish; let attempts = 0;
    r.publisher.publish = async (entry, tag) => {
      if (++attempts === 1) {
        r.calls.push(['publish', entry.name, tag]); drift(r, dependency);
        throw Object.assign(Error('timeout before upload'), { retryable: true });
      }
      await original(entry, tag);
    };
    await assert.rejects(publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true }),
      /conflict|absent|Provenance source|repository mismatch|Invalid registry metadata|ETIMEDOUT|E403|E429|ECONNRESET/);
    assert.equal(attempts, 1); assert.equal(r.calls.filter(call => call[0] === 'publish').length, 1);
    assert.equal(r.calls.filter(call => call[0] === 'tag').length, 0);
    assert.equal(r.versions.has(f.artifact.packages[0].name), false);
    const ledger = JSON.parse(fs.readFileSync(f.ledgerFile));
    assert.equal(ledger.status, 'failed'); assert.equal(ledger.packages[0].state, 'failed');
    assert.equal(ledger.packages[0].attempt, 1); assert.equal(ledger.manifestIntegrity, f.artifact.manifestIntegrity);
    assert.equal(ledger.sourceSha, f.artifact.sourceSha);
  });
}
test('dependency drifting during the final target lookup stops even the first actual upload', async t => {
  const f = await packedFixture(t, { selection: { groups: ['mcp'] } }), r = registryFixture(f.artifact);
  for (const dependency of f.artifact.registryDependencies) r.installed(dependency, 'latest');
  const dependency = f.artifact.registryDependencies[0], original = r.registry.package; let lookups = 0;
  r.registry.package = async entry => {
    const observed = await original(entry);
    if (entry.name === f.artifact.packages[0].name && ++lookups === 2) r.versions.get(dependency.name).dist.integrity = 'different';
    return observed;
  };
  await assert.rejects(publishRelease({ visibilityDelayMs: 0, artifact: f.artifact, ...r, ledgerFile: f.ledgerFile, publish: true }), /conflict/);
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
  assert.equal(JSON.parse(fs.readFileSync(f.ledgerFile)).packages[0].uploadAttempted, undefined);
});

test('delayed version visibility polls bounded reads, then continues dependency order with one upload per package', async t => {
  const { f, r, run } = await setup(t), original = r.publisher.publish, read = r.registry.version;
  let delayed, polls = 0; const delays = [];
  r.publisher.publish = async (entry, tag) => { await original(entry, tag); if (!delayed) delayed = entry.name; };
  r.registry.version = async entry => delayed === entry.name && ++polls <= 2 ? null : read(entry);
  const ledger = await run({ publish: true, visibilityAttempts: 3, visibilityDelayMs: 17, wait: async ms => delays.push(ms) });
  assert.equal(ledger.status, 'complete'); assert.deepEqual(delays, [17, 17]);
  assert.deepEqual(r.calls.filter(call => call[0] === 'publish').map(call => call[1]), f.artifact.order);
});
test('transient network errors during verification are polled without uploading again', async t => {
  const { r, run } = await setup(t), read = r.registry.version, original = r.publisher.publish;
  let requested = false, reads = 0;
  r.publisher.publish = async (...args) => { requested = true; await original(...args); };
  r.registry.version = async entry => { if (requested && ++reads <= 2) throw Error('ECONNRESET'); return read(entry); };
  assert.equal((await run({ publish: true, visibilityAttempts: 3 })).status, 'complete');
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 10);
});
test('uncertain timeout remains read-only across repeated publish and preflight resumes until original request becomes visible', async t => {
  const { f, r, run } = await setup(t), original = r.publisher.publish; let attempts = 0;
  r.publisher.publish = async () => { attempts++; throw Error('connection lost'); };
  for (const publish of [true, false, true]) assert.equal((await run({ publish })).status, 'pending-verification');
  assert.equal(attempts, 1);
  r.installed(f.artifact.packages[0], 'latest'); r.publisher.publish = original;
  assert.equal((await run({ publish: true })).status, 'complete');
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 9);
});
test('write-ahead marker survives an interruption before invoking publisher; replay does not guess that upload was absent', async t => {
  const { f, r, run } = await setup(t); let interrupted = false;
  await assert.rejects(run({ publish: true, onLedger(ledger) {
    if (!interrupted && ledger.packages.some(item => item.uploadAttempted)) { interrupted = true; throw Error('interrupted'); }
  } }), /interrupted/);
  assert.equal(JSON.parse(fs.readFileSync(f.ledgerFile)).packages[0].uploadAttempted, true);
  assert.equal((await run({ publish: true })).status, 'pending-verification');
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
});
test('post-request integrity conflict stops immediately and its persisted marker prevents any new upload on resume', async t => {
  const { f, r, run } = await setup(t), original = r.publisher.publish;
  r.publisher.publish = async (entry, tag) => { await original(entry, tag); r.versions.get(entry.name).dist.integrity = 'wrong'; };
  for (let i = 0; i < 2; i++) await assert.rejects(run({ publish: true }), /integrity conflict/);
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 1);
  assert.equal(JSON.parse(fs.readFileSync(f.ledgerFile)).packages[0].uploadAttempted, true);
});
test('polling configuration is bounded before registry or upload work', async t => {
  const { r, run } = await setup(t);
  for (const options of [{ visibilityAttempts: 0 }, { visibilityAttempts: 11 }, { visibilityAttempts: 1.5 },
    { visibilityDelayMs: -1 }, { visibilityDelayMs: 10001 }, { visibilityDelayMs: NaN }]) await assert.rejects(run(options));
  assert.deepEqual(r.calls, []);
});

// diagnostics regression contracts; kept in the approved source member.
{
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { npmDiagnostic, redact } = require('../../scripts/release/npm.cjs');
const { runNpm, npmAdapters } = require('../../scripts/release/npm.cjs');
const { packedFixture, registryFixture } = require('./fixtures.cjs');
const { publishRelease } = require('./authority-fixture.cjs').loadPublisher();
const secret = 'SECRET_DO_NOT_EXPOSE';
for (const code of ['E404', 'E401', 'E403', 'EOTP', 'ENEEDAUTH', 'EPUBLISHCONFLICT', 'E429', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN']) {
  test(`npm diagnostics retain actionable ${code} without free-form output`, () => {
    for (const result of [{ stdout: JSON.stringify({ error: { code, summary: secret, detail: secret } }) },
      { stderr: `npm error code ${code}\nAuthorization: Bearer ${secret}\nhttps://user:${secret}@registry.npmjs.org/?token=${secret}` }]) {
      const diagnostic = npmDiagnostic(result);
      assert.equal(diagnostic.code, code); assert.ok(diagnostic.hint.length > 15);
      assert.ok(!JSON.stringify(diagnostic).includes(secret));
    }
  });
}
test('unknown codes, malformed output and timed out requests cannot leak arbitrary diagnostics', () => {
  for (const result of [{ stdout: secret, stderr: secret }, { stdout: JSON.stringify({ error: { code: secret } }) }, { status: secret }])
    assert.equal(npmDiagnostic(result).code, 'ENPM');
  assert.equal(npmDiagnostic({ timedOut: true }).code, 'ETIMEDOUT');
  const input = `Authorization: Bearer ${secret}\n_authToken=${secret}\npassword=${secret}\nhttps://user:${secret}@example.test?sig=${secret}\nnpm_${secret.replaceAll('_', '')}`;
  assert.ok(!redact(input).includes(secret));
  assert.ok(!redact(input).includes('SECRETDONOTEXPOSE'));
});
test('real subprocess stderr is converted to a code without returning raw headers or secrets', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-npm-diagnostic-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cli = path.join(directory, 'mock-npm.cjs');
  fs.writeFileSync(cli, `console.error('npm error code E403\\nAuthorization: Bearer ${secret}'); process.exitCode = 1;`);
  const result = await runNpm(cli, ['publish'], directory);
  assert.equal(result.diagnostic.code, 'E403'); assert.ok(!JSON.stringify(result).includes(secret));
});
test('npm error code survives in a pending ledger and thrown dry-run error without token-bearing output', async t => {
  const f = await packedFixture(t), r = registryFixture(f.artifact);
  const { publisher } = npmAdapters({ publishCommand: async () => ({ status: 1,
    stdout: JSON.stringify({ error: { code: 'E404', summary: secret } }), stderr: `Authorization: Bearer ${secret}` }) });
  await assert.rejects(publisher.dryRun(f.artifact.packages[0], 'latest'), error => error.message.includes('E404') && !error.message.includes(secret));
  const ledger = await publishRelease({ artifact: f.artifact, registry: r.registry, publisher: { publish: publisher.publish },
    ledgerFile: f.ledgerFile, publish: true, visibilityDelayMs: 0 });
  assert.equal(ledger.status, 'pending-verification'); assert.equal(ledger.packages[0].publishDiagnostic.code, 'E404');
  assert.ok(!fs.readFileSync(f.ledgerFile, 'utf8').includes(secret));
});
}

// resume regression contracts; kept in the approved source member.
{
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { packedFixture, registryFixture } = require('./fixtures.cjs');
const { zip, hash } = require('./union-fixture.cjs');
const { loadUploadHistory, publishJob, publishStep } = require('../../scripts/release/npm.cjs');
async function setup(t, { attempts = 1 } = {}) {
  const f = await packedFixture(t), sourceSha = f.artifact.sourceSha, calls = [], bytes = new Map();
  const workflow = { id: 16, path: '.github/workflows/xtend-default-gates.yml' };
  const run = (id, run_attempt) => ({ id, run_attempt, head_sha: sourceSha, head_branch: 'main', event: 'workflow_dispatch',
    repository: { full_name: 'konnilabs/xtend' }, head_repository: { full_name: 'konnilabs/xtend' }, workflow_id: 16, status: 'completed' });
  const current = run(442, 1), prior = run(441, attempts), runs = [current, prior];
  const env = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'konnilabs/xtend', GITHUB_SHA: sourceSha, GITHUB_RUN_ID: '442', GITHUB_RUN_ATTEMPT: '1' };
  const ledgers = [], metadata = [], jobs = [];
  const canonicalLedger = await require('./authority-fixture.cjs').loadPublisher().publishRelease({
    artifact: f.artifact, ...registryFixture(f.artifact), ledgerFile: f.ledgerFile });
  canonicalLedger.mode = 'direct-publish'; fs.unlinkSync(f.ledgerFile);
  function rewrite(index) {
    const raw = zip(path.join(f.directory, `upload-state-${index}.zip`), { 'npm-release-ledger.json': JSON.stringify(ledgers[index]) });
    bytes.set(901 + index, raw); metadata[index].digest = 'sha256:' + hash(raw);
  }
  for (let index = 0; index < attempts; index++) {
    const ledger = structuredClone(canonicalLedger);
    ledger.status = 'pending-verification';
    Object.assign(ledger.packages[0], { state: 'pending-verification', uploadAttempted: true, attempt: 1, uploadTag: 'latest' });
    ledgers.push(ledger);
    metadata.push({ id: 901 + index, name: `xtend-npm-upload-state-${index + 1}`, expired: false, workflow_run: { id: 441, head_sha: sourceSha } });
    jobs.push({ name: publishJob, status: 'completed', conclusion: 'failure', run_id: 441, head_sha: sourceSha, run_attempt: index + 1,
      steps: [{ name: publishStep, status: 'completed', conclusion: 'failure' }] });
    rewrite(index);
  }
  const request = async resource => {
    calls.push(resource);
    if (resource.endsWith('/workflows/xtend-default-gates.yml')) return workflow;
    if (resource.includes('/runs?head_sha=')) return { workflow_runs: runs, total_count: runs.length };
    const attempt = /\/runs\/441\/attempts\/(\d+)(\/jobs.*)?$/.exec(resource);
    if (attempt) return attempt[2] ? { total_count: 1, jobs: [jobs[Number(attempt[1]) - 1]] } : run(441, Number(attempt[1]));
    if (resource.includes('/441/artifacts?')) return { total_count: metadata.length, artifacts: metadata };
    const archive = /\/artifacts\/(\d+)\/zip$/.exec(resource);
    if (archive) return { status: 302, headers: { get: () => `https://storage.invalid/${archive[1]}` } };
    throw Error('Unexpected mock read: ' + resource);
  };
  const fetchBytes = async url => ({ status: 200, arrayBuffer: async () => bytes.get(Number(new URL(url).pathname.slice(1))) });
  const options = { artifact: f.artifact, ledgerFile: f.ledgerFile, env, request, fetchBytes };
  return { f, calls, runs, metadata, jobs, bytes, ledgers, rewrite, options, restore: async () => {
    const priorLedgers = await loadUploadHistory(options);
    if (priorLedgers.length) return require('./authority-fixture.cjs').loadPublisher().publishRelease({ artifact: f.artifact,
      ...registryFixture(f.artifact), ledgerFile: f.ledgerFile, priorLedgers, visibilityDelayMs: 0 });
  } };

}
test('authenticated prior upload ledger restores on a fresh runner and forbids duplicate upload despite repeated 404', async t => {
  const f = await setup(t); await f.restore();
  const r = registryFixture(f.f.artifact), api = require('./authority-fixture.cjs').loadPublisher();
  const result = await api.publishRelease({ artifact: f.f.artifact, ...r, ledgerFile: f.f.ledgerFile, publish: true, visibilityDelayMs: 0 });
  assert.equal(result.status, 'pending-verification'); assert.equal(result.packages[0].uploadAttempted, true);
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 0);
  r.installed(f.f.artifact.packages[0], 'latest');
  assert.equal((await api.publishRelease({ artifact: f.f.artifact, ...r, ledgerFile: f.f.ledgerFile, publish: true, visibilityDelayMs: 0 })).status, 'complete');
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 9);
});
test('history union cannot erase an earlier upload with a later pending-only ledger', async t => {
  const f = await setup(t, { attempts: 2 });
  for (const key of ['uploadAttempted', 'attempt', 'uploadTag']) delete f.ledgers[1].packages[0][key];
  f.ledgers[1].packages[0].state = 'pending'; f.rewrite(1); await f.restore();
  assert.equal(JSON.parse(fs.readFileSync(f.f.ledgerFile)).packages[0].uploadAttempted, true);
});
test('a queued rerun does not hide the previous completed upload attempt', async t => {
  const f = await setup(t, { attempts: 2 }); f.runs[1].status = 'queued';
  await f.restore();
  assert.equal(JSON.parse(fs.readFileSync(f.f.ledgerFile)).packages[0].uploadAttempted, true);
  assert.ok(f.calls.some(resource => resource.includes('/441/attempts/1/jobs')));
  assert.ok(!f.calls.some(resource => resource.includes('/441/attempts/2')));
});
test('same workflow run attempt two restores upload markers from attempt one', async t => {
  const f = await setup(t); f.runs.shift(); f.runs[0].run_attempt = 2;
  f.options.env.GITHUB_RUN_ID = '441'; f.options.env.GITHUB_RUN_ATTEMPT = '2';
  await f.restore();
  assert.equal(JSON.parse(fs.readFileSync(f.f.ledgerFile)).packages[0].uploadAttempted, true);
  assert.ok(f.calls.some(resource => resource.includes('/441/attempts/1/jobs')));
  assert.ok(!f.calls.some(resource => resource.includes('/441/attempts/2')));
});
test('the GitHub filtered-run cap cannot silently truncate upload history', async t => {
  const f = await setup(t); while (f.runs.length < 1000) f.runs.push(f.runs[1]);
  await assert.rejects(f.restore(), /search cap/);
  assert.equal(fs.existsSync(f.f.ledgerFile), false);
});
test('first run without prior publish boundary needs no ledger and performs only Actions reads', async t => {
  const f = await setup(t); f.runs.pop(); await f.restore();
  assert.equal(fs.existsSync(f.f.ledgerFile), false);
  assert.equal(f.calls.length, 2); assert.ok(f.calls.every(resource => resource.startsWith('/repos/konnilabs/xtend/actions/')));
});
test('skipped prior publish step has no upload history requirement', async t => {
  const f = await setup(t); f.jobs[0].steps[0].conclusion = 'skipped'; f.metadata.length = 0; await f.restore();
  assert.equal(fs.existsSync(f.f.ledgerFile), false);
});
for (const problem of ['missing-ledger', 'duplicate-ledger', 'expired', 'wrong-source', 'wrong-run', 'corrupt-zip', 'wrong-artifact',
  'wrong-package', 'wrong-channel', 'incomplete-job', 'missing-boundary', 'missing-current', 'foreign-job-attempt', 'foreign-job-source']) {
  test(`hosted history fails closed before overwriting local state: ${problem}`, async t => {
    const f = await setup(t);
    if (problem === 'missing-ledger') f.metadata.length = 0;
    if (problem === 'duplicate-ledger') f.metadata.push(f.metadata[0]);
    if (problem === 'expired') f.metadata[0].expired = true;
    if (problem === 'wrong-source') f.metadata[0].workflow_run.head_sha = 'e'.repeat(40);
    if (problem === 'wrong-run') f.metadata[0].workflow_run.id = 443;
    if (problem === 'corrupt-zip') f.bytes.set(901, Buffer.from('substituted'));
    if (problem === 'wrong-artifact') { f.ledgers[0].manifestIntegrity = 'other'; f.rewrite(0); }
    if (problem === 'wrong-package') { f.ledgers[0].packages[0].integrity = 'other'; f.rewrite(0); }
    if (problem === 'wrong-channel') { f.ledgers[0].packages[0].uploadTag = 'other'; f.rewrite(0); }
    if (problem === 'incomplete-job') f.jobs[0].status = 'in_progress';
    if (problem === 'missing-boundary') f.jobs[0].steps = [];
    if (problem === 'missing-current') f.runs.shift();
    if (problem === 'foreign-job-attempt') f.jobs[0].run_attempt++;
    if (problem === 'foreign-job-source') f.jobs[0].head_sha = 'b'.repeat(40);
    fs.mkdirSync(path.dirname(f.f.ledgerFile), { recursive: true });
    const before = JSON.stringify(f.ledgers[0]); fs.writeFileSync(f.f.ledgerFile, before);
    await assert.rejects(f.restore());
    assert.equal(fs.readFileSync(f.f.ledgerFile, 'utf8'), before);
  });
}
test('network failure while loading upload history never authorizes a new request', async t => {
  const f = await setup(t); f.options.request = async () => { throw Error('read failed'); };
  await assert.rejects(f.restore(), /read failed/); assert.equal(fs.existsSync(f.f.ledgerFile), false);
});
}

test('invalid resume package/channel identity retains the original upload marker and ledger bytes', async t => {
  const { f, r, run } = await setup(t);
  r.publisher.publish = async () => { throw Error('uncertain'); };
  assert.equal((await run({ publish: true })).status, 'pending-verification');
  const previous = JSON.parse(fs.readFileSync(f.ledgerFile)); previous.packages[1].tag = 'wrong';
  fs.writeFileSync(f.ledgerFile, JSON.stringify(previous)); const before = fs.readFileSync(f.ledgerFile);
  await assert.rejects(run({ publish: true }), /package\/order\/channel/);
  assert.deepEqual(fs.readFileSync(f.ledgerFile), before);
  assert.equal(previous.packages[0].uploadAttempted, true);
});

test('a transient hosted history failure retains a truthful ledger and a later retry can recover without assuming an upload', async t => {
  const { f, r, run } = await setup(t);
  await assert.rejects(run({ publish: true, loadPriorLedgers: async () => { throw Error('GitHub read failed'); } }), /GitHub read failed/);
  assert.equal(r.calls.length, 0);
  const ledger = JSON.parse(fs.readFileSync(f.ledgerFile));
  assert.equal(ledger.status, 'failed'); assert.ok(ledger.packages.every(item => !item.uploadAttempted));
  assert.equal((await run({ publish: true, loadPriorLedgers: async () => [ledger] })).status, 'complete');
  assert.equal(r.calls.filter(call => call[0] === 'publish').length, 10);
});
test('history API failure cannot erase a locally persisted uncertain upload marker', async t => {
  const { f, r, run } = await setup(t); let requests = 0;
  r.publisher.publish = async () => { requests++; throw Error('uncertain'); };
  await run({ publish: true });
  await assert.rejects(run({ publish: true, loadPriorLedgers: async () => { throw Error('GitHub read failed'); } }), /GitHub read failed/);
  assert.equal(JSON.parse(fs.readFileSync(f.ledgerFile)).packages[0].uploadAttempted, true);
  assert.equal((await run({ publish: true })).status, 'pending-verification'); assert.equal(requests, 1);
});
