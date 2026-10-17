'use strict';
// Unmodified public GET attempts/1/jobs response, captured with API 2022-11-28.
// This failed PR run proves response compatibility, never Seal/product acceptance.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const union = require('../../scripts/release/union.cjs');
const { githubRequest } = require('../../scripts/release/github.cjs');
const { fixture } = require('./union-fixture.cjs');
const bytes = fs.readFileSync(path.join(__dirname, 'fixtures/github-jobs-attempt.2022-11-28.json'));
const captured = JSON.parse(bytes), name = 'Verify pinned union source artifact';
const context = { runId: '38083841736', runAttempt: '1', sourceSha: '7e797f6620f00d09370542279739c88222cc32ed' };
const realJob = captured.jobs.find(job => job.name === name);
test('unaltered real attempt response: all 22 jobs, exact source/run/attempt and producer job shape', () => {
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), '6bbf92d6c013072ebea389ee924bbc7b19acc7c391857640d1afed44341a50f2');
  assert.equal(captured.total_count, 22); assert.equal(captured.jobs.length, 22);
  for (const job of captured.jobs) {
    assert.equal(String(job.run_id), context.runId); assert.equal(job.head_sha, context.sourceSha);
    assert.equal(job.run_attempt, 1);
  }
  assert.equal(union.checkJob(captured.jobs, name, context), realJob);
});
test('schema-optional run_attempt may be absent; every other captured producer field is unchanged', () => {
  const absent = structuredClone(realJob); delete absent.run_attempt;
  assert.equal(union.checkJob([absent], name, context), absent);
  assert.deepEqual(Object.keys(absent).sort(), Object.keys(realJob).filter(key => key !== 'run_attempt').sort());
  for (const key of Object.keys(absent)) assert.deepEqual(absent[key], realJob[key]);
});
for (const value of [2, null, '1', 0, -1, undefined]) test('present job attempt contradicts authenticated origin: ' + String(value), () => {
  const job = structuredClone(realJob); job.run_attempt = value;
  assert.throws(() => union.checkJob([job], name, context), /contradicts authenticated attempt/);
});
for (const [field, value] of [['run_id', 99], ['run_id', undefined], ['head_sha', 'e'.repeat(40)], ['head_sha', undefined]]) {
  test('captured job still rejects wrong/missing ' + field + ': ' + String(value), () => {
    const job = structuredClone(realJob); delete job.run_attempt;
    if (value === undefined) delete job[field]; else job[field] = value;
    assert.throws(() => union.checkJob([job], name, context), /another run\/source/);
  });
}
test('real read-only transport authenticates the exact fixed-repository attempt endpoint', async () => {
  const resource = '/repos/konnilabs/xtend/actions/runs/38083841736/attempts/1/jobs?per_page=100&page=1';
  const calls = [];
  const request = githubRequest({ token: 'controlled-test-only', request: async (url, options) => {
    calls.push({ url, options }); return { status: 200, json: async () => captured };
  } });
  assert.equal(await request(resource), captured);
  assert.equal(calls[0].url, 'https://api.github.com' + resource);
  assert.equal(calls[0].options.headers['X-GitHub-Api-Version'], '2022-11-28');
  assert.equal(calls[0].options.redirect, 'error');
  await assert.rejects(request(resource.replace('/konnilabs/', '/foreign/')), /Fixed repository/);
  assert.equal(calls.length, 1);
});
test('real fresh verifier requests the attempt endpoint and tolerates omitted optional job fields, without accepting miniature source', async t => {
  const f = fixture(t); for (const job of f.jobs) delete job.run_attempt;
  await assert.rejects(union.verifyFreshUnion(f.options), /Archive digest|gzip|header|manifest/);
  assert.ok(f.calls.includes('/repos/konnilabs/xtend/actions/runs/109101/attempts/1'));
  assert.ok(f.calls.includes('/repos/konnilabs/xtend/actions/runs/109101/attempts/1/jobs?per_page=100&page=1'));
  assert.ok(!f.calls.includes('/repos/konnilabs/xtend/actions/runs/109101/jobs?per_page=100&page=1'));
  assert.equal(fs.existsSync(f.options.directory), false);
});
for (const [field, value] of [['id', 99], ['run_attempt', 2]]) test('independent run response rejects wrong ' + field + ' before jobs or artifact reads', async t => {
  const f = fixture(t); for (const job of f.jobs) delete job.run_attempt;
  f.run[field] = value;
  await assert.rejects(union.verifyFreshUnion(f.options), /workflow run\/attempt\/repository\/head mismatch/);
  assert.ok(!f.calls.some(resource => resource.includes('/jobs') || resource.includes('/artifacts')));
  assert.equal(fs.existsSync(f.options.directory), false);
});
